import type { Context } from 'hono'

export function getOrigin(c: Context): string {
  try {
    return new URL(c.req.url).origin
  } catch {
    return ''
  }
}

export function toProxyUrl(origin: string, url: string): string {
  if (!origin) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname.endsWith('.hf.space') && parsed.pathname.startsWith('/gradio_api/file=')) {
      return `${origin}/api/proxy-image?url=${encodeURIComponent(url)}`
    }
  } catch {
    // ignore invalid URL, fall back to raw string checks
  }

  if (url.includes('.hf.space/gradio_api/file=')) {
    return `${origin}/api/proxy-image?url=${encodeURIComponent(url)}`
  }

  return url
}
