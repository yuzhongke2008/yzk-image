import { Hono } from 'hono'
import { cors } from 'hono/cors'
import OpenAI from 'openai'

type Bindings = {
  CORS_ORIGINS?: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('/*', async (c, next) => {
  const origins = c.env?.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000']
  return cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-API-Key'],
  })(c, next)
})

app.get('/', (c) => {
  return c.json({ message: 'Z-Image API is running' })
})

app.post('/generate', async (c) => {
  const apiKey = c.req.header('X-API-Key')
  if (!apiKey) {
    return c.json({ error: 'API Key is required' }, 401)
  }

  let body: {
    prompt: string
    negative_prompt?: string
    model?: string
    width?: number
    height?: number
    num_inference_steps?: number
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  // Input validation
  if (!body.prompt || typeof body.prompt !== 'string') {
    return c.json({ error: 'prompt is required and must be a string' }, 400)
  }
  if (body.prompt.length > 10000) {
    return c.json({ error: 'prompt exceeds maximum length of 10000' }, 400)
  }

  const width = body.width ?? 1024
  const height = body.height ?? 1024
  const steps = body.num_inference_steps ?? 9

  if (width < 256 || width > 2048 || height < 256 || height > 2048) {
    return c.json({ error: 'width and height must be between 256 and 2048' }, 400)
  }
  if (steps < 1 || steps > 50) {
    return c.json({ error: 'num_inference_steps must be between 1 and 50' }, 400)
  }

  const client = new OpenAI({
    baseURL: 'https://ai.gitee.com/v1',
    apiKey: apiKey.trim(),
  })

  try {
    const response = await client.images.generate({
      prompt: body.prompt,
      model: body.model || 'z-image-turbo',
      size: `${width}x${height}` as '1024x1024',
      // @ts-expect-error extra_body is supported by OpenAI SDK
      extra_body: {
        negative_prompt: body.negative_prompt || '',
        num_inference_steps: steps,
      },
    })

    const imageData = response.data?.[0]
    if (!imageData || (!imageData.url && !imageData.b64_json)) {
      return c.json({ error: 'No image returned from API' }, 500)
    }

    return c.json({
      url: imageData.url,
      b64_json: imageData.b64_json,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return c.json({ error: message }, 500)
  }
})

export default app
