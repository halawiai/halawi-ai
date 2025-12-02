# Models Review Guide

## Current Status

You have **118 models** currently displayed in your application.

## How Models Work

1. **Source**: Models are fetched from the HuggingFace Router API (`https://router.huggingface.co/v1/models`)
2. **Configuration**: The `MODELS` environment variable in `chart/env/dev.yaml` and `chart/env/prod.yaml` can override model properties
3. **Visibility**: Models with `"unlisted": true` are hidden from the UI

## Current Configuration

### Models in dev.yaml
Your `chart/env/dev.yaml` currently has **115 models** configured with descriptions:
- Lines 78-194 contain the MODELS array
- These models have custom descriptions
- None are currently marked as `unlisted: true`

### Models in prod.yaml  
Your `chart/env/prod.yaml` has **115 models** configured (same as dev)

## How to Review Models

### Option 1: View in Browser
Visit `/models` in your application to see all currently visible models.

### Option 2: Use the Review Script
Run the review script to see all models from the API and compare with your config:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/review-models.ts
```

This will show you:
- All models available from the API
- Which models are in your config vs not
- How many models you have total

### Option 3: List All Models Script
To see a simple list of all model IDs:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/list-models.ts
```

### Option 4: Categorize by Provider
To see which models come from which providers (Groq, Hugging Face, Together, etc.):

**Quick Summary:**
```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/model-providers-summary.ts
```

**Detailed Breakdown:**
```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/categorize-models.ts
```

This will show you:
- Models grouped by inference provider (Groq, Hugging Face, Together, Fireworks, etc.)
- Models grouped by organization/creator (deepseek-ai, meta-llama, Qwen, etc.)
- Summary statistics

## How to Restrict Models

To hide models, add entries to the `MODELS` array in your config files with `"unlisted": true`:

```yaml
MODELS: > 
  [
    { "id": "model-id-to-hide", "unlisted": true },
    { "id": "another-model-id", "unlisted": true },
    # ... your existing model entries with descriptions ...
  ]
```

**Important Notes:**
- You can add `"unlisted": true` to models that are already in your config
- You can add new entries for models not in your config (they'll be hidden)
- Models without an entry in MODELS will be visible by default
- After making changes, you'll need to restart/redeploy your application

## Example: Restricting Models

If you want to hide 50 models, you could:

1. Identify the model IDs you want to hide
2. Add them to the MODELS array:

```yaml
MODELS: > 
  [
    # Models to hide
    { "id": "model-1", "unlisted": true },
    { "id": "model-2", "unlisted": true },
    # ... more models to hide ...
    
    # Models to keep visible (with descriptions)
    { "id": "deepseek-ai/DeepSeek-V3.2-Exp", "description": "Experimental V3.2..." },
    { "id": "zai-org/GLM-4.6", "description": "Next-gen GLM..." },
    # ... rest of your models ...
  ]
```

## Quick Reference

- **Config files**: `chart/env/dev.yaml` and `chart/env/prod.yaml`
- **Models page**: `/models` route in your app
- **Code location**: `src/routes/models/+page.svelte` (line 76 filters by `unlisted`)
- **Model processing**: `src/lib/server/models.ts` (handles MODELS env var)

