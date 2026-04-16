import { ApiError, ApiErrorCode, Errors, HF_SPACES } from '@z-image/shared'
import { MAX_INT32 } from '../../constants'
import type { ImageCapability, ImageRequest, ImageResult } from '../../core/types'
import { callGradioApi } from '../../utils'

function normalizeImageUrl(baseUrl: string, url: string): string {
  try {
    // 🔧 强制处理各种 URL 格式
    let normalizedUrl = url
    
    // 1. 如果是相对路径，拼接 baseUrl
    if (normalizedUrl.startsWith('/')) {
      normalizedUrl = `${baseUrl}${normalizedUrl}`
    }
    // 2. 如果是 file= 开头但没有域名，转换为完整 URL
    else if (normalizedUrl.includes('file=') && !normalizedUrl.startsWith('http')) {
      normalizedUrl = `${baseUrl}/file=${normalizedUrl.split('file=').pop()}`
    }
    // 3. 如果是完整 URL，直接使用
    
    // 4. 转换为标准 URL 对象并添加缓存破坏参数
    const finalUrl = new URL(normalizedUrl, baseUrl).toString()
    return `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
  } catch (error) {
    console.error('Failed to normalize image URL:', url, error)
    return url
  }
}

function parseSeedFromResponse(modelId: string, result: unknown[], fallbackSeed: number): number {
  if (modelId === 'qwen-image-fast' && typeof result[1] === 'string') {
    const match = result[1].match(/Seed used for generation:\s*(\d+)/)
    if (match) return Number.parseInt(match[1], 10)
  }
  if (typeof result[1] === 'number') return result[1]
  return fallbackSeed
}

function getCandidateBaseUrls(modelId: string): string[] {
  const primary = HF_SPACES[modelId as keyof typeof HF_SPACES] || HF_SPACES['z-image-turbo']
  const fallbacks =
    modelId === 'z-image-turbo' ? ['https://mrfakename-z-image-turbo.hf.space'] : ([] as string[])
  return [primary, ...fallbacks].filter(Boolean)
}

function isNotFoundProviderError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.code === ApiErrorCode.PROVIDER_ERROR && (err.details?.upstream || '').includes('404')
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code
    const details = (err as { details?: unknown }).details as { upstream?: string } | undefined
    return code === ApiErrorCode.PROVIDER_ERROR && (details?.upstream || '').includes('404')
  }
  return false
}

function isRetryableError(err: unknown): boolean {
  const msg = String(err)
  const is503 = msg.includes('503') || msg.includes('temporarily unavailable') || msg.includes('loading')
  const isNetwork = msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('ECONNRESET')
  return is503 || isNetwork
}

const MODEL_CONFIGS: Record<
  string,
  { endpoint: string; buildData: (r: ImageRequest, seed: number) => unknown[] }
> = {
  'z-image-turbo': {
    endpoint: 'generate_image',
    buildData: (r, seed) => [r.prompt, r.height, r.width, r.steps ?? 9, seed, false],
  },
  'qwen-image-fast': {
    endpoint: 'generate_image',
    buildData: (r, seed) => [r.prompt, seed, true, '1:1', 3, r.steps ?? 8],
  },
  'ovis-image': {
    endpoint: 'generate',
    buildData: (r, seed) => [r.prompt, r.height, r.width, seed, r.steps ?? 24, 4],
  },
  'flux-1-schnell': {
    endpoint: 'infer',
    buildData: (r, seed) => [r.prompt, seed, false, r.width, r.height, r.steps ?? 8],
  },
}

export const huggingfaceImage: ImageCapability = {
  async generate(request: ImageRequest, token?: string | null): Promise<ImageResult> {
    const seed = request.seed ?? Math.floor(Math.random() * MAX_INT32)
    const modelId = request.model || 'z-image-turbo'
    const config = MODEL_CONFIGS[modelId] || MODEL_CONFIGS['z-image-turbo']
    let lastErr: unknown
    let imageUrl: string | undefined
    let data: unknown[] | undefined

    for (const baseUrl of getCandidateBaseUrls(modelId)) {
      let retries = 0
      const maxRetries = 3
      let success = false

      while (retries < maxRetries && !success) {
        try {
          if (retries > 0) {
            await new Promise((res) => setTimeout(res, 1500 * retries))
          }

          data = await callGradioApi(
            baseUrl,
            config.endpoint,
            config.buildData(request, seed),
            token || undefined
          )

          const result = data as Array<{ url?: string } | number | string>
          const first = result[0]
          const rawUrl =
            typeof first === 'string' ? first : (first as { url?: string } | null | undefined)?.url
          
          if (!rawUrl) {
            console.error('No URL in response:', result)
            throw Errors.generationFailed('HuggingFace', 'No image URL in response')
          }
          
          imageUrl = normalizeImageUrl(baseUrl, rawUrl)
          console.log('✅ Generated image URL:', imageUrl)
          
          if (!imageUrl) throw Errors.generationFailed('HuggingFace', 'No image returned')
          
          success = true
        } catch (err) {
          lastErr = err
          if (isNotFoundProviderError(err)) {
            break
          }
          if (isRetryableError(err) && retries < maxRetries - 1) {
            retries++
            continue
          }
          break
        }
      }
      if (success) break
    }

    if (!imageUrl) {
      if (lastErr) throw lastErr
      throw Errors.generationFailed('HuggingFace', 'No image returned')
    }

    return {
      url: imageUrl,
      seed: parseSeedFromResponse(modelId, data as unknown[], seed),
      model: modelId,
    }
  },
}
