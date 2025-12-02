# Model Management Guide

**Last Updated:** November 23, 2025

This guide explains how to categorize, filter, and enable/disable models in the halawi-ai application.

---

## Model Categorization

Models are automatically categorized by:

1. **Capability Type:**
   - **Premium:** Models with tool support (function calling, agent workflows)
   - **Text:** Standard text-only language models
   - **Vision:** Multimodal models with image understanding
   - **Audio:** Speech-to-text transcription models

2. **Inference Provider:**
   - Models are categorized by their inference provider (Groq, Hugging Face, Together, Fireworks, etc.)
   - Provider information comes from the HuggingFace Router API

3. **Organization:**
   - Models are grouped by their creator/organization (e.g., `openai`, `meta-llama`, `Qwen`)

---

## Enabling/Disabling Models

### Method 1: Using `unlisted` Flag (Recommended)

Models can be enabled or disabled by setting the `unlisted` property in the `MODELS` configuration:

**Location:** `chart/env/dev.yaml` or `chart/env/prod.yaml`

**To Disable a Model:**
```yaml
MODELS: > 
  [
    { "id": "model-id-to-disable", "unlisted": true },
    { "id": "another-model-id", "unlisted": true },
    # ... other models ...
  ]
```

**To Enable a Model:**
```yaml
MODELS: > 
  [
    { "id": "model-id-to-enable", "unlisted": false },
    # Or simply remove the unlisted property
    { "id": "model-id-to-enable" },
    # ... other models ...
  ]
```

**Notes:**
- Models with `"unlisted": true` are hidden from the UI but remain in the configuration
- Disabled models won't appear in the `/models` page
- Disabled models won't be selectable in the model selector
- Changes require application restart/redeployment

### Method 2: Remove from Configuration

Completely remove a model from the `MODELS` array to disable it:

```yaml
MODELS: > 
  [
    # Model removed - will not be available
    { "id": "other-model-id", "description": "..." },
    # ... other models ...
  ]
```

**Note:** This method requires re-adding the model ID if you want to re-enable it later.

---

## Filtering Models

### Frontend Filtering

The `/models` page supports filtering by:

1. **Search:** Text search across model ID, name, and display name
2. **Provider:** Dropdown filter to show models from specific inference providers (Groq, Hugging Face, Together, etc.)

**Usage:**
- Visit `/models` page
- Use the search box to filter by name
- Use the provider dropdown to filter by inference provider
- Click "Clear filters" to reset

### Backend Filtering

Models are filtered server-side based on:
- `unlisted` flag (disabled models are excluded)
- Model availability from the HuggingFace Router API

---

## Categorization Scripts

### 1. Categorize by Features (Premium/Text/Vision/Audio)

```bash
npx tsx scripts/categorize-models-by-features.ts
```

Generates documentation categorizing models by capabilities.

### 2. Categorize by Provider

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/categorize-models-by-provider.ts
```

Generates documentation categorizing models by inference provider and organization.

**Output includes:**
- Models grouped by provider (Groq, Hugging Face, Together, etc.)
- Models grouped by organization (model creator)
- Enabled/disabled status for each model
- Quick reference lists

---

## Example: Disabling Models by Provider

To disable all models from a specific provider, you can use a script or manually update the configuration:

**Example: Disable all Groq models**

```yaml
MODELS: > 
  [
    { "id": "openai/gpt-oss-120b", "unlisted": true },  # Groq provider
    { "id": "openai/gpt-oss-20b", "unlisted": true },   # Groq provider
    { "id": "llama-3.3-70b-versatile", "unlisted": true },  # Groq provider
    # ... other models remain enabled ...
  ]
```

**To find which provider a model uses:**
1. Run the provider categorization script
2. Check the HuggingFace Router API response
3. Look at the model's `providers` array in the API response

---

## Model Configuration Structure

Each model in the `MODELS` array can have:

```typescript
{
  id: string;                    // Required: Model identifier
  description?: string;          // Optional: Model description
  displayName?: string;          // Optional: Custom display name
  unlisted?: boolean;            // Optional: Hide from UI (default: false)
  // ... other optional fields
}
```

---

## Best Practices

1. **Use `unlisted` for temporary disabling:** Keeps models in config for easy re-enabling
2. **Document disabled models:** Add comments explaining why models are disabled
3. **Test after changes:** Restart the application and verify model visibility
4. **Keep configurations in sync:** Update both `dev.yaml` and `prod.yaml` if needed
5. **Use scripts for bulk operations:** The categorization scripts help identify models to enable/disable

---

## Troubleshooting

### Model not appearing after enabling

1. **Check `unlisted` flag:** Ensure `unlisted` is `false` or not set
2. **Verify model ID:** Model ID must match exactly (case-sensitive)
3. **Check API availability:** Model must be available from HuggingFace Router API
4. **Restart application:** Configuration changes require restart
5. **Check logs:** Look for model loading errors in application logs

### Model still visible after disabling

1. **Verify configuration:** Check that `unlisted: true` is set correctly
2. **Check both config files:** Ensure changes are in the correct environment file
3. **Clear cache:** Browser cache might show old model list
4. **Restart application:** Configuration changes require restart

---

## Related Files

- **Configuration:** `chart/env/dev.yaml`, `chart/env/prod.yaml`
- **Model Documentation:** `MODELS_DOCUMENTATION.md`
- **Categorization Scripts:**
  - `scripts/categorize-models-by-features.ts`
  - `scripts/categorize-models-by-provider.ts`
- **Frontend:** `src/routes/models/+page.svelte`
- **Backend:** `src/lib/server/models.ts`

---

## Quick Reference

**Enable Model:**
```yaml
{ "id": "model-id", "unlisted": false }
```

**Disable Model:**
```yaml
{ "id": "model-id", "unlisted": true }
```

**Filter by Provider (Frontend):**
- Visit `/models` page
- Select provider from dropdown

**Regenerate Documentation:**
```bash
npx tsx scripts/categorize-models-by-features.ts
npx tsx scripts/categorize-models-by-provider.ts
```

