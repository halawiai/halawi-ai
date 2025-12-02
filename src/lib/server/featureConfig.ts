import { config } from "$lib/server/config";
import { logger } from "$lib/server/logger";
import JSON5 from "json5";

export interface ModelCapabilities {
	webSearch?: boolean;
	codeInterpreter?: boolean;
	vision?: boolean;
	audio?: boolean;
}

export interface ProviderConfig {
	enabled: boolean;
	models: Record<string, boolean>;
}

export interface FeatureConfig {
	openai?: ProviderConfig;
	groq?: ProviderConfig;
	huggingface?: ProviderConfig;
	together?: ProviderConfig;
	fireworks?: ProviderConfig;
	anyscale?: ProviderConfig;
	perplexity?: ProviderConfig;
	// Add more providers as needed
	[key: string]: ProviderConfig | undefined;
	knowledgeBase?: {
		enabled: boolean;
		allowSync?: boolean;
	};
	modelCapabilities?: Record<string, ModelCapabilities>;
}

const defaultFeatureConfig: FeatureConfig = {
	groq: {
		enabled: true,
		models: {
			// Premium Reasoning Models
			"openai/gpt-oss-120b": true,
			"openai/gpt-oss-20b": true,
			// Text Chat Models
			"llama-3.3-70b-versatile": true,
			"llama-3.1-8b-instant": true,
			"qwen/qwen3-32b": true,
			"moonshotai/kimi-k2-instruct-0905": true,
			// Vision Models (Experimental)
			"meta-llama/llama-4-maverick-17b-128e-instruct": true,
			"meta-llama/llama-4-scout-17b-16e-instruct": true,
			// Audio Models
			"whisper-large-v3": true,
			"whisper-large-v3-turbo": true,
		},
	},
	openai: {
		enabled: false,
		models: {
			"gpt-4o": true,
			"gpt-4o-mini": true,
			"gpt-4-turbo": true,
			"gpt-3.5-turbo": true,
		},
	},
	knowledgeBase: {
		enabled: false,
		allowSync: false,
	},
	modelCapabilities: {
		// OpenAI Models (Disabled for compliance)
		"gpt-4o": { webSearch: true, codeInterpreter: true, vision: true, audio: false },
		"gpt-4o-mini": { webSearch: true, codeInterpreter: true, vision: true, audio: false },
		// Premium Reasoning Models
		"openai/gpt-oss-120b": { webSearch: true, codeInterpreter: true, vision: false, audio: false },
		"openai/gpt-oss-20b": { webSearch: true, codeInterpreter: true, vision: false, audio: false },
		// Text Chat Models
		"llama-3.3-70b-versatile": {
			webSearch: false,
			codeInterpreter: false,
			vision: false,
			audio: false,
		},
		"llama-3.1-8b-instant": {
			webSearch: false,
			codeInterpreter: false,
			vision: false,
			audio: false,
		},
		"qwen/qwen3-32b": { webSearch: false, codeInterpreter: false, vision: false, audio: false },
		"moonshotai/kimi-k2-instruct-0905": {
			webSearch: false,
			codeInterpreter: false,
			vision: false,
			audio: false,
		},
		// Vision Models (Experimental)
		"meta-llama/llama-4-maverick-17b-128e-instruct": {
			webSearch: false,
			codeInterpreter: false,
			vision: true,
			audio: false,
		},
		"meta-llama/llama-4-scout-17b-16e-instruct": {
			webSearch: false,
			codeInterpreter: false,
			vision: true,
			audio: false,
		},
		// Audio Models
		"whisper-large-v3": { webSearch: false, codeInterpreter: false, vision: false, audio: true },
		"whisper-large-v3-turbo": {
			webSearch: false,
			codeInterpreter: false,
			vision: false,
			audio: true,
		},
	},
};

let cachedFeatureConfig: FeatureConfig | null = null;

/**
 * Get the feature configuration
 * Can be loaded from FEATURE_CONFIG environment variable or uses defaults
 */
export function getFeatureConfig(): FeatureConfig {
	if (cachedFeatureConfig) {
		return cachedFeatureConfig;
	}

	const featureConfigEnv = config.FEATURE_CONFIG;

	if (!featureConfigEnv || !featureConfigEnv.trim()) {
		logger.info("[featureConfig] Using default feature configuration");
		cachedFeatureConfig = defaultFeatureConfig;
		return cachedFeatureConfig;
	}

	try {
		// Support both JSON and JSON5 formats
		const sanitized = featureConfigEnv.trim();
		const parsed = JSON5.parse(sanitized);
		cachedFeatureConfig = { ...defaultFeatureConfig, ...parsed };
		logger.info("[featureConfig] Loaded feature configuration from environment");
		return cachedFeatureConfig;
	} catch (error) {
		logger.error({ error }, "[featureConfig] Failed to parse FEATURE_CONFIG, using defaults");
		cachedFeatureConfig = defaultFeatureConfig;
		return cachedFeatureConfig;
	}
}

/**
 * Check if a model is enabled based on feature config
 */
export function isModelEnabled(modelId: string, provider?: string): boolean {
	const featureConfig = getFeatureConfig();
	const featureConfigEnv = config.FEATURE_CONFIG;
	const hasFeatureConfig = featureConfigEnv && featureConfigEnv.trim();

	// If FEATURE_CONFIG is not set, allow all models (backward compatibility)
	if (!hasFeatureConfig) {
		return true;
	}

	// If provider is specified, check provider-level enablement first
	if (provider) {
		const providerKey = provider.toLowerCase();
		const providerConfig = featureConfig[providerKey];

		// If provider config exists but is disabled, model is disabled
		if (providerConfig && !providerConfig.enabled) {
			logger.debug({ modelId, provider }, "[featureConfig] Model disabled: provider is disabled");
			return false;
		}

		// If provider is enabled, check if model is in the list
		if (providerConfig && providerConfig.enabled) {
			if (providerConfig.models && modelId in providerConfig.models) {
				const enabled = providerConfig.models[modelId] === true;
				logger.debug(
					{ modelId, provider, enabled },
					"[featureConfig] Model found in provider config"
				);
				return enabled;
			} else {
				// Provider is enabled but model not in list - disable it
				logger.debug(
					{ modelId, provider },
					"[featureConfig] Model disabled: not in provider's model list"
				);
				return false;
			}
		}
	}

	// Check all providers for this model (fallback if provider not detected)
	for (const [providerName, providerConfig] of Object.entries(featureConfig)) {
		if (providerName === "knowledgeBase" || providerName === "modelCapabilities") {
			continue;
		}

		// If provider is disabled, skip it
		if (providerConfig && !providerConfig.enabled) {
			continue;
		}

		// If provider is enabled, check if model is in the list
		if (providerConfig && providerConfig.enabled) {
			if (providerConfig.models && modelId in providerConfig.models) {
				const enabled = providerConfig.models[modelId] === true;
				logger.debug(
					{ modelId, provider: providerName, enabled },
					"[featureConfig] Model found in provider config (fallback)"
				);
				return enabled;
			}
		}
	}

	// Model not found in any enabled provider's model list - disable it
	// This is the strict mode: if FEATURE_CONFIG is set, only explicitly listed models are allowed
	logger.debug(
		{ modelId, provider },
		"[featureConfig] Model disabled: not found in any provider config"
	);
	return false;
}

/**
 * Get model capabilities from feature config
 */
export function getModelCapabilities(modelId: string): ModelCapabilities | undefined {
	const featureConfig = getFeatureConfig();
	return featureConfig.modelCapabilities?.[modelId];
}

/**
 * Check if knowledge base is enabled
 */
export function isKnowledgeBaseEnabled(): boolean {
	const featureConfig = getFeatureConfig();
	return featureConfig.knowledgeBase?.enabled === true;
}

/**
 * Check if knowledge base sync is allowed
 */
export function isKnowledgeBaseSyncAllowed(): boolean {
	const featureConfig = getFeatureConfig();
	return featureConfig.knowledgeBase?.allowSync === true;
}

/**
 * Get provider for a model ID (heuristic based on model ID patterns)
 * This is a fallback - ideally provider should come from the API
 */
export function inferProviderFromModelId(modelId: string): string | undefined {
	const id = modelId.toLowerCase();

	// Groq models - check for common Groq model patterns
	if (
		id.includes("gpt-oss") ||
		id.includes("llama-3") ||
		id.includes("llama-4") ||
		id.includes("qwen") ||
		id.includes("kimi") ||
		id.includes("whisper")
	) {
		return "groq";
	}

	// OpenAI models
	if (id.startsWith("gpt-")) {
		return "openai";
	}

	// Hugging Face models (default for most models with /)
	if (id.includes("/")) {
		return "huggingface";
	}

	return undefined;
}
