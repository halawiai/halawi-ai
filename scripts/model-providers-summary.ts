#!/usr/bin/env tsx
/**
 * Quick summary of models by provider
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/model-providers-summary.ts
 */

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

interface Model {
	id: string;
	providers?: Array<{ provider: string; [key: string]: unknown }>;
}

async function getProviderSummary() {
	try {
		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const models: Model[] = json.data || [];

		// Group by provider
		const byProvider = new Map<string, string[]>();

		models.forEach((model) => {
			if (model.providers && model.providers.length > 0) {
				model.providers.forEach((prov) => {
					const providerName = prov.provider || "unknown";
					if (!byProvider.has(providerName)) {
						byProvider.set(providerName, []);
					}
					const providerModels = byProvider.get(providerName);
					if (providerModels) {
						providerModels.push(model.id);
					}
				});
			}
		});

		// Sort by count
		const sorted = Array.from(byProvider.entries()).sort((a, b) => b[1].length - a[1].length);

		console.log("=".repeat(80));
		console.log("MODELS BY PROVIDER - QUICK SUMMARY");
		console.log("=".repeat(80));
		console.log();

		sorted.forEach(([provider, modelIds]) => {
			console.log(`${provider}: ${modelIds.length} models`);
			console.log(
				`  Examples: ${modelIds.slice(0, 5).join(", ")}${modelIds.length > 5 ? "..." : ""}`
			);
			console.log();
		});

		console.log(`\nTotal providers: ${sorted.length}`);
		console.log(`Total models: ${models.length}`);
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

getProviderSummary();
