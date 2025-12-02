/**
 * Example Feature Configuration
 *
 * Copy this to your environment variable FEATURE_CONFIG or use as a reference
 *
 * Usage in chart/env/dev.yaml or chart/env/prod.yaml:
 *   FEATURE_CONFIG: >
 *     {
 *       "groq": {
 *         "enabled": true,
 *         "models": {
 *           "openai/gpt-oss-120b": true,
 *           "openai/gpt-oss-20b": true,
 *           "llama-3.3-70b-versatile": true
 *         }
 *       },
 *       "openai": {
 *         "enabled": false,
 *         "models": {}
 *       }
 *     }
 */

export const FEATURE_CONFIG = {
	// OpenAI Models Configuration
	openai: {
		enabled: false, // Set to false to disable ALL OpenAI models
		models: {
			"gpt-4o": true,
			"gpt-4o-mini": true,
			"gpt-4-turbo": true,
			"gpt-3.5-turbo": true,
		},
	},

	// Groq Models Configuration
	groq: {
		enabled: true, // Set to false to disable ALL Groq models
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

	// Hugging Face Models Configuration
	huggingface: {
		enabled: false, // Set to false to disable ALL Hugging Face models
		models: {
			// Add specific Hugging Face models here
		},
	},

	// Together AI Models Configuration
	together: {
		enabled: false,
		models: {},
	},

	// Fireworks AI Models Configuration
	fireworks: {
		enabled: false,
		models: {},
	},

	// Knowledge Base (Notion + RAG) Configuration
	knowledgeBase: {
		enabled: false, // Set to false to disable knowledge base features entirely
		allowSync: false, // Set to false to prevent users from triggering Notion syncs
	},

	// Tool Capabilities per Model
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
