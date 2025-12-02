# Troubleshooting FEATURE_CONFIG

If models are still showing after adding FEATURE_CONFIG, follow these steps:

---

## Step 1: Verify FEATURE_CONFIG is Set

Check that FEATURE_CONFIG is in your YAML file:

```bash
grep -A 5 "FEATURE_CONFIG" chart/env/dev.yaml
```

You should see the JSON configuration.

---

## Step 2: Restart the Application

**CRITICAL:** FEATURE_CONFIG is loaded at application startup. You MUST restart the application for changes to take effect.

```bash
# If running locally
npm run dev  # Stop and restart

# If using Docker
docker-compose restart

# If using Kubernetes
kubectl rollout restart deployment/your-deployment
```

---

## Step 3: Check Application Logs

After restarting, check the logs for feature config messages:

```bash
# Look for these log messages:
[featureConfig] Loaded feature configuration from environment
[featureConfig] Model disabled by feature config
```

If you see `[featureConfig] Using default feature configuration`, the FEATURE_CONFIG environment variable is not being loaded.

---

## Step 4: Verify Model IDs Match Exactly

Model IDs are **case-sensitive** and must match exactly. Common issues:

- ❌ `"moonshotai/Kimi-K2-Thinking"` (wrong - different variant)
- ✅ `"moonshotai/kimi-k2-instruct-0905"` (correct - matches config)

To find the exact model IDs from the API:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/list-models.ts | grep -i groq
```

---

## Step 5: Check Provider Detection

The system tries to detect providers from the API response. If detection fails, it falls back to heuristics.

To see which provider is detected for each model, check the logs after restart. Models should show:
- `[featureConfig] Model found in provider config` (enabled)
- `[featureConfig] Model disabled: not in provider's model list` (disabled)

---

## Step 6: Test with Minimal Config

Try a minimal config to test:

```yaml
FEATURE_CONFIG: >
  {
    "groq": {
      "enabled": true,
      "models": {
        "openai/gpt-oss-120b": true
      }
    },
    "openai": {
      "enabled": false,
      "models": {}
    },
    "huggingface": {
      "enabled": false,
      "models": {}
    }
  }
```

After restart, you should only see `openai/gpt-oss-120b` in the models list.

---

## Common Issues

### Issue: All models still visible

**Causes:**
1. Application not restarted
2. FEATURE_CONFIG not in environment variables
3. JSON syntax error in FEATURE_CONFIG
4. Model IDs don't match exactly

**Solution:**
1. Restart application
2. Check logs for parsing errors
3. Verify JSON syntax
4. Match model IDs exactly (case-sensitive)

### Issue: No models visible

**Causes:**
1. All providers disabled
2. Model IDs don't match
3. Provider detection failing

**Solution:**
1. Check that at least one provider has `"enabled": true`
2. Verify model IDs match exactly
3. Check logs for provider detection issues

### Issue: Some Groq models missing

**Causes:**
1. Model ID not in the `models` list
2. Model ID has different case/variant

**Solution:**
1. Add missing model IDs to the `groq.models` object
2. Verify exact model ID from API

---

## Debug Commands

### Check if FEATURE_CONFIG is loaded:

```bash
# In your application logs, look for:
grep "featureConfig" server.log
```

### List all model IDs from API:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/list-models.ts
```

### Check which models are Groq:

```bash
OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key \
  npx tsx scripts/categorize-models-by-provider.ts | grep -i groq
```

---

## Verification Checklist

- [ ] FEATURE_CONFIG is in `chart/env/dev.yaml` (or `prod.yaml`)
- [ ] JSON syntax is valid (no trailing commas, proper quotes)
- [ ] Application has been restarted
- [ ] Logs show `[featureConfig] Loaded feature configuration from environment`
- [ ] Model IDs in config match exactly with API (case-sensitive)
- [ ] At least one provider has `"enabled": true`
- [ ] Models are listed in the provider's `models` object

---

## Still Not Working?

1. **Check the exact model IDs** from the API and update FEATURE_CONFIG
2. **Enable debug logging** - check application logs for `[featureConfig]` messages
3. **Test with one model** - use minimal config with just one model to verify it works
4. **Check environment variable** - verify FEATURE_CONFIG is actually being passed to the application

