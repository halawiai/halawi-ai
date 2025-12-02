# Restrict to Groq Models Only

This guide shows how to disable all models except Groq models.

---

## Quick Method: Automated Script

Run this script to automatically update your configuration:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/restrict-to-groq-only.ts
```

**What it does:**
1. Fetches all models from the HuggingFace Router API
2. Identifies which models use Groq as their provider
3. Updates `chart/env/dev.yaml` and `chart/env/prod.yaml`
4. Sets `"unlisted": true` for all non-Groq models
5. Keeps Groq models enabled (removes `unlisted` flag)

**After running:**
1. Review the changes in the YAML files
2. Restart your application
3. Verify only Groq models appear on `/models` page

---

## Manual Method

If you prefer to do it manually or want to see which models are Groq first:

### Step 1: Identify Groq Models

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/identify-groq-models.ts
```

This will show you:
- List of all Groq models
- List of all non-Groq models
- Groq model IDs for reference

### Step 2: Update Configuration Files

Edit `chart/env/dev.yaml` and `chart/env/prod.yaml`:

For each model in the `MODELS` array:

**If it's a Groq model** - ensure it doesn't have `unlisted: true`:
```yaml
{ "id": "groq-model-id", "description": "..." }  # No unlisted property
```

**If it's NOT a Groq model** - add `unlisted: true`:
```yaml
{ "id": "non-groq-model-id", "description": "...", "unlisted": true }
```

### Step 3: Example

```yaml
MODELS: > 
  [
    # Groq models (enabled)
    { "id": "openai/gpt-oss-120b", "description": "..." },
    { "id": "openai/gpt-oss-20b", "description": "..." },
    { "id": "llama-3.3-70b-versatile", "description": "..." },
    
    # Non-Groq models (disabled)
    { "id": "deepseek-ai/DeepSeek-V3.2-Exp", "description": "...", "unlisted": true },
    { "id": "zai-org/GLM-4.6", "description": "...", "unlisted": true },
    { "id": "Qwen/Qwen3-VL-235B-A22B-Instruct", "description": "...", "unlisted": true },
    # ... all other non-Groq models with unlisted: true ...
  ]
```

---

## Verify Changes

1. **Check configuration:**
   ```bash
   # Count enabled models (should only be Groq models)
   grep -v '"unlisted": true' chart/env/dev.yaml | grep -c '"id"'
   ```

2. **Test in UI:**
   - Visit `/models` page
   - Only Groq models should be visible
   - Use provider filter dropdown - select "groq" to verify

3. **Check API:**
   ```bash
   curl http://localhost:5173/api/v2/models | jq '.[] | select(.unlisted != true) | .id'
   ```
   (Should only show Groq model IDs)

---

## Revert Changes

To re-enable all models, remove all `"unlisted": true` entries:

```bash
# Using sed (backup first!)
cp chart/env/dev.yaml chart/env/dev.yaml.backup
sed -i '' 's/, "unlisted": true//g' chart/env/dev.yaml
sed -i '' 's/"unlisted": true, //g' chart/env/dev.yaml
```

Or manually remove `"unlisted": true` from all model entries.

---

## Common Groq Models

Based on typical Groq offerings, these models are commonly available via Groq:

- `openai/gpt-oss-120b`
- `openai/gpt-oss-20b`
- `llama-3.3-70b-versatile`
- `llama-3.1-8b-instant`
- `qwen/qwen3-32b`
- `moonshotai/kimi-k2-instruct-0905`
- `meta-llama/llama-4-maverick-17b-128e-instruct`
- `meta-llama/llama-4-scout-17b-16e-instruct`
- `whisper-large-v3`
- `whisper-large-v3-turbo`

**Note:** The actual list depends on what's available in the HuggingFace Router API. Use the identification script to get the current list.

---

## Troubleshooting

### Script fails to identify Groq models

- Check your API key is valid
- Verify `OPENAI_BASE_URL` is correct
- Check network connectivity to HuggingFace Router API

### Models still visible after restricting

- Ensure you restarted the application
- Check that `unlisted: true` was added correctly
- Verify JSON syntax is valid (no trailing commas)
- Clear browser cache

### Want to allow specific non-Groq models

After running the script, manually edit the config files and remove `"unlisted": true` from specific models you want to keep enabled.

---

## Related Files

- **Script:** `scripts/restrict-to-groq-only.ts`
- **Identification:** `scripts/identify-groq-models.ts`
- **Configuration:** `chart/env/dev.yaml`, `chart/env/prod.yaml`
- **Documentation:** `BACKEND_MODEL_ENABLE_DISABLE.md`

