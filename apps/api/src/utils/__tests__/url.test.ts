/**
 * Utils Unit Tests
 * Tests for URL utilities
 */

import { describe, expect, it } from 'vitest'
import { toProxyUrl } from '../url'

describe('toProxyUrl', () => {
  it('should return original url when origin is empty', () => {
    expect(toProxyUrl('', 'https://example.com/image.png')).toBe('https://example.com/image.png')
  })

  it('should proxy HuggingFace gradio file URLs', () => {
    const origin = 'https://example.com'
    const url = 'https://abc123.hf.space/gradio_api/file=image.png'
    expect(toProxyUrl(origin, url)).toBe(
      'https://example.com/api/proxy-image?url=https%3A%2F%2Fabc123.hf.space%2Fgradio_api%2Ffile%3Dimage.png'
    )
  })

  it('should proxy via string fallback for non-URL inputs', () => {
    const origin = 'https://example.com'
    const url = 'abc123.hf.space/gradio_api/file=image.png'
    expect(toProxyUrl(origin, url)).toBe(
      'https://example.com/api/proxy-image?url=abc123.hf.space%2Fgradio_api%2Ffile%3Dimage.png'
    )
  })

  it('should not proxy unrelated URLs', () => {
    expect(toProxyUrl('https://example.com', 'https://abc123.hf.space/file=image.png')).toBe(
      'https://abc123.hf.space/file=image.png'
    )
    expect(toProxyUrl('https://example.com', 'https://example.com/image.png')).toBe(
      'https://example.com/image.png'
    )
  })
})
