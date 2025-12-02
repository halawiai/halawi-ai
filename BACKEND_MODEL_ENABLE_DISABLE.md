# Backend Model Enable/Disable Guide

**Location:** Configuration files in the Helm chart

---

## Configuration Files

Models are enabled/disabled in these files:

1. **Development:** `chart/env/dev.yaml`
2. **Production:** `chart/env/prod.yaml`

Both files contain a `MODELS` environment variable that controls which models are available.

---

## Exact Location in Files

### File: `chart/env/dev.yaml`

**Line:** ~78 (starts around line 78)

```yaml
envVars:
  # ... other environment variables ...
  MODELS: > 
    [
      { "id": "model-id-1", "description": "..." },
      { "id": "model-id-2", "description": "..." },
      # ... more models ...
    ]
```

### File: `chart/env/prod.yaml`

**Line:** ~88 (starts around line 88)

Same structure as `dev.yaml`.

---

## How to Enable/Disable Models

### To DISABLE a Model

Add `"unlisted": true` to the model entry:

```yaml
MODELS: > 
  [
    { "id": "openai/gpt-oss-120b", "description": "...", "unlisted": true },
    { "id": "openai/gpt-oss-20b", "description": "...", "unlisted": true },
    { "id": "other-model-id", "description": "..." },  # This one stays enabled
  ]
```

### To ENABLE a Model

Set `"unlisted": false` or remove the `unlisted` property:

```yaml
MODELS: > 
  [
    { "id": "openai/gpt-oss-120b", "description": "...", "unlisted": false },
    # OR simply:
    { "id": "openai/gpt-oss-120b", "description": "..." },
  ]
```

---

## Example: Disabling Multiple Models

```yaml
envVars:
  MODELS: > 
    [
      # Disabled models
      { "id": "openai/gpt-oss-120b", "description": "High performing open model suitable for large scale applications.", "unlisted": true },
      { "id": "openai/gpt-oss-20b", "description": "Efficient open model for reasoning and tool use, runs locally.", "unlisted": true },
      
      # Enabled models
      { "id": "deepseek-ai/DeepSeek-V3.2-Exp", "description": "Experimental V3.2 release..." },
      { "id": "zai-org/GLM-4.6", "description": "Next-gen GLM..." },
      # ... rest of enabled models ...
    ]
```

---

## How It Works

1. **Backend Processing:**
   - The `MODELS` environment variable is read by `src/lib/server/models.ts`
   - Function `getModelOverrides()` parses the JSON array
   - Models with `unlisted: true` are marked as hidden

2. **Frontend Filtering:**
   - Models are filtered in `src/routes/models/+page.svelte` (line 76)
   - Filter: `.filter((el) => !el.unlisted)`
   - Disabled models won't appear in the UI

3. **API Response:**
   - The `/api/v2/models` endpoint returns all models
   - Frontend filters out `unlisted: true` models
   - Disabled models are still in the API but hidden from users

---

## Step-by-Step Instructions

### Step 1: Open the Configuration File

```bash
# For development
code chart/env/dev.yaml

# For production
code chart/env/prod.yaml
```

### Step 2: Find the MODELS Array

Look for the line starting with `MODELS: >` (around line 78 in dev.yaml, line 88 in prod.yaml)

### Step 3: Edit Model Entries

Add or modify the `unlisted` property:

```yaml
# Before (enabled)
{ "id": "model-id", "description": "Model description" }

# After (disabled)
{ "id": "model-id", "description": "Model description", "unlisted": true }
```

### Step 4: Save and Deploy

After making changes:

1. **Save the file**
2. **Restart the application** (or redeploy if using Kubernetes)
3. **Verify** by visiting `/models` page - disabled models should not appear

---

## Quick Reference

| Action | Configuration |
|--------|--------------|
| **Disable model** | Add `"unlisted": true` |
| **Enable model** | Set `"unlisted": false` or remove property |
| **File location** | `chart/env/dev.yaml` or `chart/env/prod.yaml` |
| **Line number** | ~78 (dev) or ~88 (prod) |
| **Property name** | `MODELS` (environment variable) |

---

## Verification

After making changes, verify:

1. **Check configuration:**
   ```bash
   # View the MODELS array
   grep -A 200 "MODELS:" chart/env/dev.yaml | head -20
   ```

2. **Test in UI:**
   - Visit `http://localhost:5173/models` (or your app URL)
   - Disabled models should not appear in the list

3. **Check API:**
   ```bash
   curl http://localhost:5173/api/v2/models | jq '.[] | select(.unlisted == true)'
   ```
   (Disabled models will have `unlisted: true` in the API response)

---

## Notes

- **Changes require restart:** Configuration changes only take effect after restarting the application
- **Both files:** Update both `dev.yaml` and `prod.yaml` if you want consistent behavior
- **JSON syntax:** The `MODELS` value is a JSON array, so ensure proper JSON formatting
- **YAML multiline:** The `>` syntax allows multiline JSON in YAML
- **Case sensitive:** Model IDs are case-sensitive

---

## Troubleshooting

### Model still visible after disabling

1. ✅ Check that `"unlisted": true` is set correctly
2. ✅ Verify JSON syntax is valid (no trailing commas, proper quotes)
3. ✅ Restart the application
4. ✅ Clear browser cache

### Model not appearing after enabling

1. ✅ Check that `"unlisted": false` or property is removed
2. ✅ Verify model ID matches exactly (case-sensitive)
3. ✅ Ensure model exists in HuggingFace Router API
4. ✅ Check application logs for errors

### JSON parsing errors

If you see errors like "Failed to parse MODELS overrides":

1. ✅ Validate JSON syntax (use a JSON validator)
2. ✅ Check for trailing commas
3. ✅ Ensure all strings are properly quoted
4. ✅ Verify the array is properly closed with `]`

---

## Related Files

- **Backend code:** `src/lib/server/models.ts` (line 154-167: `getModelOverrides()`)
- **Frontend filter:** `src/routes/models/+page.svelte` (line 76: `.filter((el) => !el.unlisted)`)
- **API endpoint:** `src/lib/server/api/routes/groups/models.ts`
- **Documentation:** `MODEL_MANAGEMENT.md`

