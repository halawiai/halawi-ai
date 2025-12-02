#!/usr/bin/env tsx
/**
 * Script to categorize models by provider (Groq, Hugging Face, etc.) and organization
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/categorize-models.ts
 */

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

interface Model {
	id: string;
	description?: string;
	providers?: Array<{ provider: string; [key: string]: unknown }>;
}

async function categorizeModels() {
	try {
		console.log(`Fetching models from: ${OPENAI_BASE_URL}/models\n`);

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const models: Model[] = json.data || [];

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

		// Sort organizations by number of models
		const sortedOrgs = Array.from(byOrganization.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);

		console.log("=".repeat(80));
		console.log("MODELS BY INFERENCE PROVIDER");
		console.log("=".repeat(80));
		console.log();
		console.log(`Total models: ${models.length}`);
		console.log(`Total providers: ${byProvider.size}`);
		console.log();

		sortedProviders.forEach(([provider, providerModels]) => {
			console.log(`\n${provider.toUpperCase()} (${providerModels.length} models)`);
			console.log("-".repeat(80));
			providerModels.forEach((model, index) => {
				console.log(`  ${(index + 1).toString().padStart(3)}. ${model.id}`);
			});
		});

		if (modelsWithoutProviders.length > 0) {
			console.log(`\n\nMODELS WITHOUT PROVIDERS (${modelsWithoutProviders.length} models)`);
			console.log("-".repeat(80));
			modelsWithoutProviders.forEach((model, index) => {
				console.log(`  ${(index + 1).toString().padStart(3)}. ${model.id}`);
			});
		}

		console.log("\n\n");
		console.log("=".repeat(80));
		console.log("MODELS BY ORGANIZATION (Model Creator)");
		console.log("=".repeat(80));
		console.log();
		console.log(`Total organizations: ${byOrganization.size}`);
		console.log();

		sortedOrgs.forEach(([org, orgModels]) => {
			console.log(`\n${org.toUpperCase()} (${orgModels.length} models)`);
			console.log("-".repeat(80));
			orgModels.forEach((model, index) => {
				const providers = model.providers?.map((p) => p.provider).join(", ") || "No providers";
				console.log(`  ${(index + 1).toString().padStart(3)}. ${model.id}`);
				console.log(`      Providers: ${providers}`);
			});
		});

		// Summary statistics
		console.log("\n\n");
		console.log("=".repeat(80));
		console.log("SUMMARY STATISTICS");
		console.log("=".repeat(80));
		console.log();
		console.log("Top 10 Providers by Model Count:");
		sortedProviders.slice(0, 10).forEach(([provider, providerModels], index) => {
			console.log(
				`  ${(index + 1).toString().padStart(2)}. ${provider.padEnd(30)} ${providerModels.length} models`
			);
		});

		console.log();
		console.log("Top 10 Organizations by Model Count:");
		sortedOrgs.slice(0, 10).forEach(([org, orgModels], index) => {
			console.log(
				`  ${(index + 1).toString().padStart(2)}. ${org.padEnd(30)} ${orgModels.length} models`
			);
		});

		// Provider breakdown for specific providers
		console.log("\n\n");
		console.log("=".repeat(80));
		console.log("SPECIFIC PROVIDER BREAKDOWN");
		console.log("=".repeat(80));

		const commonProviders = [
			"groq",
			"huggingface",
			"together",
			"fireworks",
			"anyscale",
			"perplexity",
			"openai",
		];
		commonProviders.forEach((providerName) => {
			const found = sortedProviders.find(([name]) =>
				name.toLowerCase().includes(providerName.toLowerCase())
			);
			if (found) {
				console.log(`\n${found[0].toUpperCase()}: ${found[1].length} models`);
				found[1].slice(0, 10).forEach((model, index) => {
					console.log(`  ${(index + 1).toString().padStart(2)}. ${model.id}`);
				});
				if (found[1].length > 10) {
					console.log(`  ... and ${found[1].length - 10} more`);
				}
			}
		});
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

categorizeModels();
