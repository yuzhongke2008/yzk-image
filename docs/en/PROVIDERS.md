# Providers & Models

This document lists all supported AI providers and their available models.

## Overview

| Provider | Auth Required | Image Format | Models Count |
|----------|---------------|--------------|--------------|
| [Gitee AI](#gitee-ai) | Yes | PNG | 5 |
| [HuggingFace](#huggingface) | Optional | WebP | 4 |
| [ModelScope](#modelscope) | Yes | PNG | 4 |

---

## Gitee AI

Official China-based AI platform with high-quality image generation.

| Field | Value |
|-------|-------|
| Auth Header | `X-API-Key` |
| Auth Required | Yes |
| Image Format | PNG |
| Get API Key | [ai.gitee.com](https://ai.gitee.com) |

### Models

| Model ID | Display Name | Negative Prompt | Steps | Guidance Scale |
|----------|--------------|-----------------|-------|----------------|
| `z-image-turbo` | Z-Image Turbo | Yes | 1-20 (default: 9) | - |
| `Qwen-Image` | Qwen Image | Yes | 4-50 (default: 20) | - |
| `flux-1-schnell` | FLUX.1 Schnell | No | 1-50 (default: 8) | 0-50 (default: 7.5) |
| `FLUX_1-Krea-dev` | FLUX.1 Krea | No | 1-50 (default: 20) | 0-20 (default: 4.5) |
| `FLUX.1-dev` | FLUX.1 | No | 1-50 (default: 20) | 0-20 (default: 4.5) |

---

## HuggingFace

Free community-powered AI platform using Gradio Spaces.

| Field | Value |
|-------|-------|
| Auth Header | `X-HF-Token` |
| Auth Required | No (rate limited without token) |
| Image Format | WebP |
| Get Token | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |

### Models

| Model ID | Display Name | Negative Prompt | Steps | Guidance Scale |
|----------|--------------|-----------------|-------|----------------|
| `z-image-turbo` | Z-Image Turbo | No | 1-20 (default: 9) | - |
| `qwen-image-fast` | Qwen Image Fast | No | 4-28 (default: 8) | - |
| `ovis-image` | Ovis Image | No | 1-50 (default: 24) | - |
| `flux-1-schnell` | FLUX.1 Schnell | No | 1-50 (default: 8) | - |

### HuggingFace Spaces

| Model | Space URL |
|-------|-----------|
| z-image-turbo | `https://mrfakename-z-image-turbo.hf.space` |
| qwen-image-fast | `https://mcp-tools-qwen-image-fast.hf.space` |
| ovis-image | `https://aidc-ai-ovis-image-7b.hf.space` |
| flux-1-schnell | `https://black-forest-labs-flux-1-schnell.hf.space` |
| upscaler | `https://tuan2308-upscaler.hf.space` |

---

## ModelScope

China-based AI model hosting platform by Alibaba.

| Field | Value |
|-------|-------|
| Auth Header | `X-MS-Token` |
| Auth Required | Yes |
| Image Format | PNG |
| Get Token | [modelscope.cn](https://modelscope.cn) |

### Models

| Model ID | Display Name | Negative Prompt | Steps | Guidance Scale |
|----------|--------------|-----------------|-------|----------------|
| `Tongyi-MAI/Z-Image-Turbo` | Z-Image Turbo | Yes | 1-20 (default: 9) | - |
| `black-forest-labs/FLUX.2-dev` | FLUX.2 | Yes | 1-50 (default: 24) | 1-10 (default: 3.5) |
| `black-forest-labs/FLUX.1-Krea-dev` | FLUX.1 Krea | Yes | 1-50 (default: 24) | 1-20 (default: 3.5) |
| `MusePublic/489_ckpt_FLUX_1` | FLUX.1 | Yes | 1-50 (default: 24) | 1-20 (default: 3.5) |

---

## Feature Comparison

### Negative Prompt Support

| Provider | Models with Negative Prompt |
|----------|----------------------------|
| Gitee AI | `z-image-turbo`, `Qwen-Image` |
| HuggingFace | None |
| ModelScope | `Tongyi-MAI/Z-Image-Turbo`, `FLUX.2-dev`, `FLUX.1-Krea-dev`, `FLUX.1` |

### Guidance Scale Support

| Provider | Models with Guidance Scale |
|----------|---------------------------|
| Gitee AI | `flux-1-schnell`, `FLUX_1-Krea-dev`, `FLUX.1-dev` |
| HuggingFace | None |
| ModelScope | `FLUX.2-dev`, `FLUX.1-Krea-dev`, `FLUX.1` |

---

## Usage Examples

### Gitee AI with Z-Image Turbo

```bash
curl -X POST https://your-project.pages.dev/api/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-gitee-api-key" \
  -d '{
    "provider": "gitee",
    "model": "z-image-turbo",
    "prompt": "a cute cat",
    "negative_prompt": "low quality, blurry",
    "steps": 9
  }'
```

### HuggingFace with FLUX.1 Schnell

```bash
curl -X POST https://your-project.pages.dev/api/generate \
  -H "Content-Type: application/json" \
  -H "X-HF-Token: your-hf-token" \
  -d '{
    "provider": "huggingface",
    "model": "flux-1-schnell",
    "prompt": "a cute cat",
    "steps": 8
  }'
```

### ModelScope with FLUX.2

```bash
curl -X POST https://your-project.pages.dev/api/generate \
  -H "Content-Type: application/json" \
  -H "X-MS-Token: your-ms-token" \
  -d '{
    "provider": "modelscope",
    "model": "black-forest-labs/FLUX.2-dev",
    "prompt": "a cute cat",
    "steps": 24,
    "guidanceScale": 3.5
  }'
```
