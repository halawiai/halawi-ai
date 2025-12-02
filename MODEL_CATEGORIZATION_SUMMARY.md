# Model Categorization Summary

**Last Updated:** November 23, 2025

## Overview

Models in halawi-ai can be categorized and filtered in multiple ways:

1. **By Capability:** Premium, Text, Vision, Audio
2. **By Provider:** Groq, Hugging Face, Together, Fireworks, etc.
3. **By Organization:** Model creator (openai, meta-llama, Qwen, etc.)

## Quick Start

### View Models by Provider

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/categorize-models-by-provider.ts
```

### View Models by Features

```bash
npx tsx scripts/categorize-models-by-features.ts
```

### Filter in UI

1. Visit `/models` page
2. Use search box to filter by name
3. Use provider dropdown to filter by inference provider

### Enable/Disable Models

Edit `chart/env/dev.yaml` or `chart/env/prod.yaml`:

```yaml
MODELS: > 
  [
    { "id": "model-id", "unlisted": true },  # Disable
    { "id": "model-id", "unlisted": false }, # Enable
  ]
```

## Documentation Files

- **MODELS_DOCUMENTATION.md** - Complete model list by capability
- **MODEL_MANAGEMENT.md** - How to enable/disable and filter models
- **MODELS_REVIEW.md** - How to review and restrict models

## Scripts

- `scripts/categorize-models-by-features.ts` - Categorize by Premium/Text/Vision/Audio
- `scripts/categorize-models-by-provider.ts` - Categorize by provider and organization
- `scripts/categorize-models.ts` - General provider/organization breakdown
