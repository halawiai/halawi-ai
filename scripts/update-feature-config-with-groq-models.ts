#!/usr/bin/env tsx
/**
 * Fetch actual Groq models from API and update FEATURE_CONFIG in dev.yaml
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/update-feature-config-with-groq-models.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

interface Model {
	id: string;
	description?: string;
	providers?: Array<{ provider: string; [key: string]: unknown }>;
}

async function updateFeatureConfig() {
	try {
		console.log("Fetching models from API...\n");

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const allModels: Model[] = json.data || [];

		// Find all Groq models
		const groqModels: string[] = [];
		allModels.forEach((model) => {
			const hasGroq = model.providers?.some((p) => p.provider?.toLowerCase().includes("groq"));
			if (hasGroq) {
				groqModels.push(model.id);
			}
		});

		groqModels.sort();

		console.log(`Found ${groqModels.length} Groq models:\n`);
		groqModels.forEach((id, i) => {
			console.log(`${(i + 1).toString().padStart(3)}. ${id}`);
		});

		// Read dev.yaml
		const devYamlPath = join(process.cwd(), "chart/env/dev.yaml");
		const yamlContent = readFileSync(devYamlPath, "utf-8");

		// Build the models object for FEATURE_CONFIG
		const modelsObject: Record<string, boolean> = {};
		groqModels.forEach((id) => {
			modelsObject[id] = true;
		});

		// Build the complete FEATURE_CONFIG JSON
		const featureConfig = {
			groq: {
				enabled: true,
				models: modelsObject,
			},
			openai: {
				enabled: false,
				models: {},
			},
			huggingface: {
				enabled: false,
				models: {},
			},
			together: {
				enabled: false,
				models: {},
			},
			fireworks: {
				enabled: false,
				models: {},
			},
			anyscale: {
				enabled: false,
				models: {},
			},
			perplexity: {
				enabled: false,
				models: {},
			},
			knowledgeBase: {
				enabled: false,
				allowSync: false,
			},
		};

		const featureConfigJson = JSON.stringify(featureConfig, null, 2);

		// Replace FEATURE_CONFIG in YAML
		const featureConfigYaml = `  FEATURE_CONFIG: >\n    ${featureConfigJson.split("\n").join("\n    ")}\n`;

		// Find and replace FEATURE_CONFIG section
		const featureConfigRegex = / {2}FEATURE_CONFIG:\s*>\s*\n[\s\S]*?(?=\n {2}[A-Z_]+:|$)/;

		let updatedYaml: string;
		if (yamlContent.match(featureConfigRegex)) {
			updatedYaml = yamlContent.replace(featureConfigRegex, featureConfigYaml.trimEnd());
		} else {
			// Insert before MODELS
			updatedYaml = yamlContent.replace(
				/( {2}PUBLIC_LLM_ROUTER_ALIAS_ID: "omni"\n)/,
				`$1${featureConfigYaml}`
			);
		}

		// Write back
		writeFileSync(devYamlPath, updatedYaml, "utf-8");

		console.log("\n" + "=".repeat(80));
		console.log("SUCCESS!");
		console.log("=".repeat(80));
		console.log(`\n✓ Updated chart/env/dev.yaml with ${groqModels.length} Groq models`);
		console.log("\n⚠️  IMPORTANT: Restart your application for changes to take effect!");
		console.log("\nNext steps:");
		console.log("  1. Restart the application (npm run dev or docker-compose restart)");
		console.log("  2. Visit /models page - only Groq models should be visible");
		console.log("  3. Check application logs for [featureConfig] messages");
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

updateFeatureConfig();
