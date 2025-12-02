#!/usr/bin/env tsx
/**
 * Categorize models by provider (Groq, OpenAI, Hugging Face, etc.)
 * and generate documentation with enable/disable information
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/categorize-models-by-provider.ts
 */

import { readFileSync } from "fs";
import { join } from "path";

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

interface Model {
	id: string;
	description?: string;
	providers?: Array<{ provider: string; [key: string]: unknown }>;
}

interface ModelConfig {
	id: string;
	description?: string;
	unlisted?: boolean;
}

// Read dev.yaml to get configured models
const devYamlPath = join(process.cwd(), "chart/env/dev.yaml");
const yamlContent = readFileSync(devYamlPath, "utf-8");

// Extract MODELS array
const modelsMatch = yamlContent.match(/MODELS:\s*>\s*\n\s*\[([\s\S]*?)\]\s*\n/);
if (!modelsMatch) {
	console.error("Could not find MODELS array in dev.yaml");
	process.exit(1);
}

// Parse JSON array
const modelsJson = modelsMatch[1]
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith("//"))
	.join("\n")
	.replace(/,\s*$/, "");

const configuredModels: ModelConfig[] = JSON.parse(`[${modelsJson}]`);
const configuredModelIds = new Set(configuredModels.map((m) => m.id));
const unlistedModelIds = new Set(configuredModels.filter((m) => m.unlisted).map((m) => m.id));

async function categorizeByProvider() {
	try {
		console.log(`Fetching models from: ${OPENAI_BASE_URL}/models\n`);

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const allModels: Model[] = json.data || [];

		// Filter to only configured models
		const models = allModels.filter((m) => configuredModelIds.has(m.id));

		// Group by provider
		const byProvider = new Map<string, Model[]>();
		const byOrganization = new Map<string, Model[]>();
		const modelsWithoutProviders: Model[] = [];

		models.forEach((model) => {
			// Extract organization (first part of model ID)
			const org = model.id.split("/")[0];
			if (!byOrganization.has(org)) {
				byOrganization.set(org, []);
			}
			const orgModels = byOrganization.get(org);
			if (orgModels) {
				orgModels.push(model);
			}

			// Group by providers
			if (model.providers && model.providers.length > 0) {
				model.providers.forEach((prov) => {
					const providerName = prov.provider || "unknown";
					if (!byProvider.has(providerName)) {
						byProvider.set(providerName, []);
					}
					const providerModels = byProvider.get(providerName);
					if (providerModels) {
						providerModels.push(model);
					}
				});
			} else {
				modelsWithoutProviders.push(model);
			}
		});

		// Sort providers by number of models
		const sortedProviders = Array.from(byProvider.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);

		// Generate documentation
		console.log("# Models by Provider\n");
		console.log(
			"**Source:** Models from HuggingFace Router API filtered by `chart/env/dev.yaml`\n"
		);
		console.log(`**Total Configured Models:** ${models.length}\n`);
		console.log(`**Enabled Models:** ${models.length - unlistedModelIds.size}\n`);
		console.log(`**Disabled Models:** ${unlistedModelIds.size}\n`);

		// Output by provider
		console.log("## Models by Inference Provider\n");

		for (const [provider, providerModels] of sortedProviders) {
			const enabled = providerModels.filter((m) => !unlistedModelIds.has(m.id));
			const disabled = providerModels.filter((m) => unlistedModelIds.has(m.id));

			console.log(`### ${provider} (${providerModels.length} models)`);
			console.log(`- **Enabled:** ${enabled.length}`);
			console.log(`- **Disabled:** ${disabled.length}\n`);

			if (enabled.length > 0) {
				console.log("**Enabled Models:**");
				enabled.forEach((model) => {
					console.log(`- \`${model.id}\``);
				});
				console.log();
			}

			if (disabled.length > 0) {
				console.log("**Disabled Models:**");
				disabled.forEach((model) => {
					console.log(`- \`${model.id}\` *(disabled)*`);
				});
				console.log();
			}
		}

		// Output by organization
		console.log("\n---\n");
		console.log("## Models by Organization (Model Creator)\n");

		const sortedOrgs = Array.from(byOrganization.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);

		for (const [org, orgModels] of sortedOrgs) {
			const enabled = orgModels.filter((m) => !unlistedModelIds.has(m.id));
			const disabled = orgModels.filter((m) => unlistedModelIds.has(m.id));

			console.log(`### ${org} (${orgModels.length} models)`);
			console.log(`- **Enabled:** ${enabled.length}`);
			console.log(`- **Disabled:** ${disabled.length}\n`);

			if (enabled.length > 0) {
				console.log("**Enabled:**", enabled.map((m) => `\`${m.id}\``).join(", "));
				console.log();
			}
		}

		// Quick reference by provider
		console.log("\n---\n");
		console.log("## Quick Reference by Provider\n");

		const commonProviders = [
			"groq",
			"huggingface",
			"together",
			"fireworks",
			"anyscale",
			"perplexity",
			"openai",
		];

		for (const providerName of commonProviders) {
			const found = sortedProviders.find(([name]) =>
				name.toLowerCase().includes(providerName.toLowerCase())
			);
			if (found) {
				const enabled = found[1].filter((m) => !unlistedModelIds.has(m.id));
				console.log(`**${found[0]}:** ${enabled.map((m) => m.id).join(", ")}`);
				console.log();
			}
		}

		// Summary
		console.log("\n---\n");
		console.log("## Summary Statistics\n");
		console.log("Top 10 Providers by Model Count:");
		sortedProviders.slice(0, 10).forEach(([provider, providerModels], index) => {
			const enabled = providerModels.filter((m) => !unlistedModelIds.has(m.id));
			console.log(
				`  ${(index + 1).toString().padStart(2)}. ${provider.padEnd(30)} ${enabled.length}/${providerModels.length} enabled`
			);
		});
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

categorizeByProvider();
