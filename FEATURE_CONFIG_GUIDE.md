# Feature Configuration Guide

This guide explains how to use the `FEATURE_CONFIG` system to enable/disable models and features.

---

## Overview

The `FEATURE_CONFIG` system provides a structured way to:
- Enable/disable models by provider (Groq, OpenAI, Hugging Face, etc.)
- Control individual model availability
- Define model capabilities (webSearch, codeInterpreter, vision, audio)
- Configure knowledge base features

---

## Configuration Location

Add `FEATURE_CONFIG` to your environment variables in:

- **Development:** `chart/env/dev.yaml`
- **Production:** `chart/env/prod.yaml`

---

## Configuration Format

The `FEATURE_CONFIG` is a JSON object with the following structure:

```json
{
  "groq": {
    "enabled": true,
    "models": {
      "openai/gpt-oss-120b": true,
      "openai/gpt-oss-20b": true,
      "llama-3.3-70b-versatile": true
    }
  },
  "openai": {
    "enabled": false,
    "models": {
      "gpt-4o": true,
      "gpt-4o-mini": true
    }
  },
  "modelCapabilities": {
    "openai/gpt-oss-120b": {
      "webSearch": true,
      "codeInterpreter": true,
      "vision": false,
      "audio": false
    }
  }
}
```

---

## Example: Restrict to Groq Only

To restrict all models except Groq models:

```yaml
envVars:
  FEATURE_CONFIG: >
    {
      "groq": {
        "enabled": true,
        "models": {
          "openai/gpt-oss-120b": true,
          "openai/gpt-oss-20b": true,
          "llama-3.3-70b-versatile": true,
          "llama-3.1-8b-instant": true,
          "qwen/qwen3-32b": true,
          "moonshotai/kimi-k2-instruct-0905": true,
          "meta-llama/llama-4-maverick-17b-128e-instruct": true,
          "meta-llama/llama-4-scout-17b-16e-instruct": true,
          "whisper-large-v3": true,
          "whisper-large-v3-turbo": true
        }
      },
      "openai": {
        "enabled": false,
        "models": {}
      },
      "huggingface": {
        "enabled": false,
        "models": {}
      },
      "together": {
        "enabled": false,
        "models": {}
      },
      "fireworks": {
        "enabled": false,
        "models": {}
      }
    }
```

---

## Provider Configuration

### Enable/Disable Entire Provider

Set `enabled: false` to disable all models from a provider:

```json
{
  "groq": {
    "enabled": false,  // Disables ALL Groq models
    "models": {}
  }
}
```

### Enable Specific Models Only

Set `enabled: true` and list only the models you want:

```json
{
  "groq": {
    "enabled": true,
    "models": {
      "openai/gpt-oss-120b": true,  // Enabled
      "openai/gpt-oss-20b": true,   // Enabled
      "llama-3.3-70b-versatile": false  // Disabled (even though provider is enabled)
    }
  }
}
```

---

## Model Capabilities

Define capabilities for each model:

```json
{
  "modelCapabilities": {
    "openai/gpt-oss-120b": {
      "webSearch": true,
      "codeInterpreter": true,
      "vision": false,
      "audio": false
    },
    "meta-llama/llama-4-maverick-17b-128e-instruct": {
      "webSearch": false,
      "codeInterpreter": false,
      "vision": true,
      "audio": false
    }
  }
}
```

**Available capabilities:**
- `webSearch`: Model can perform web searches
- `codeInterpreter`: Model can execute code
- `vision`: Model can process images
- `audio`: Model can process audio

---

## Knowledge Base Configuration

```json
{
  "knowledgeBase": {
    "enabled": false,      // Disable knowledge base entirely
    "allowSync": false     // Prevent users from triggering syncs
  }
}
```

---

## How It Works

1. **Model Loading:**
   - Models are fetched from the HuggingFace Router API
   - Provider information is extracted from the API response
   - Feature config is checked for each model

2. **Filtering Logic:**
   - If provider is disabled → model is hidden
   - If model is not in provider's `models` list → model is hidden
   - If model is explicitly set to `false` → model is hidden
   - If model is set to `true` → model is visible

3. **Priority:**
   - Feature config takes precedence over `unlisted` flag in MODELS
   - If `FEATURE_CONFIG` is not set, all models are allowed (backward compatible)
   - If `FEATURE_CONFIG` is set, only explicitly enabled models are shown

---

## Integration with Existing System

The feature config works alongside the existing `MODELS` configuration:

- **MODELS** config: Used for model descriptions and overrides
- **FEATURE_CONFIG**: Used for enable/disable control

You can still use `unlisted: true` in MODELS, but FEATURE_CONFIG will override it if set.

---

## Default Configuration

If `FEATURE_CONFIG` is not set, the system uses default values:
- Groq: Enabled with common Groq models
- OpenAI: Disabled
- All other providers: Disabled
- Knowledge Base: Disabled

See `src/lib/server/featureConfig.ts` for default values.

---

## Example: Complete Configuration

```yaml
envVars:
  FEATURE_CONFIG: >
    {
      "groq": {
        "enabled": true,
        "models": {
          "openai/gpt-oss-120b": true,
          "openai/gpt-oss-20b": true,
          "llama-3.3-70b-versatile": true,
          "llama-3.1-8b-instant": true,
          "qwen/qwen3-32b": true,
          "moonshotai/kimi-k2-instruct-0905": true,
          "meta-llama/llama-4-maverick-17b-128e-instruct": true,
          "meta-llama/llama-4-scout-17b-16e-instruct": true,
          "whisper-large-v3": true,
          "whisper-large-v3-turbo": true
        }
      },
      "openai": {
        "enabled": false,
        "models": {}
      },
      "knowledgeBase": {
        "enabled": false,
        "allowSync": false
      },
      "modelCapabilities": {
        "openai/gpt-oss-120b": {
          "webSearch": true,
          "codeInterpreter": true,
          "vision": false,
          "audio": false
        },
        "openai/gpt-oss-20b": {
          "webSearch": true,
          "codeInterpreter": true,
          "vision": false,
          "audio": false
        },
        "llama-3.3-70b-versatile": {
          "webSearch": false,
          "codeInterpreter": false,
          "vision": false,
          "audio": false
        },
        "meta-llama/llama-4-maverick-17b-128e-instruct": {
          "webSearch": false,
          "codeInterpreter": false,
          "vision": true,
          "audio": false
        },
        "whisper-large-v3": {
          "webSearch": false,
          "codeInterpreter": false,
          "vision": false,
          "audio": true
        }
      }
    }
```

---

## Verification

After setting `FEATURE_CONFIG`:

1. **Restart the application**
2. **Check logs** for `[featureConfig]` messages
3. **Visit `/models`** - only enabled models should appear
4. **Check API:**
   ```bash
   curl http://localhost:5173/api/v2/models | jq '.[] | select(.unlisted != true) | .id'
   ```

---

## Troubleshooting

### Models still visible after disabling

- ✅ Check JSON syntax is valid
- ✅ Verify provider name is lowercase (e.g., "groq" not "Groq")
- ✅ Ensure model IDs match exactly (case-sensitive)
- ✅ Restart the application

### Feature config not loading

- ✅ Check `FEATURE_CONFIG` environment variable is set
- ✅ Verify JSON syntax (use a JSON validator)
- ✅ Check application logs for parsing errors
- ✅ Ensure no trailing commas in JSON

### Want to allow all models

Remove `FEATURE_CONFIG` or set it to an empty string. The system will fall back to allowing all models.

---

## Related Files

- **Implementation:** `src/lib/server/featureConfig.ts`
- **Integration:** `src/lib/server/models.ts`
- **Example:** `featureConfig.example.ts`
- **Documentation:** This file

---

## Migration from `unlisted` Flag

If you're currently using `unlisted: true` in MODELS config:

1. **Option 1:** Keep using `unlisted` - it still works
2. **Option 2:** Migrate to FEATURE_CONFIG for better organization
3. **Option 3:** Use both - FEATURE_CONFIG takes precedence

The feature config system is designed to work alongside the existing system, so migration is optional.

