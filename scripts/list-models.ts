#!/usr/bin/env tsx
/**
 * Script to list all available models from the API
 * This helps identify which models to restrict by adding "unlisted": true
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/list-models.ts
 */

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

async function listAllModels() {
	try {
		console.log(`Fetching models from: ${OPENAI_BASE_URL}/models\n`);

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const models = json.data || [];

		console.log(`Total models found: ${models.length}\n`);
		console.log("=".repeat(80));
		console.log("All Models (use these IDs to add 'unlisted: true' in MODELS env var):");
		console.log("=".repeat(80));
		console.log();

		models.forEach((model: { id: string; description?: string }, index: number) => {
			console.log(`${(index + 1).toString().padStart(3)}. ${model.id}`);
			if (model.description) {
				console.log(
					`     ${model.description.substring(0, 70)}${model.description.length > 70 ? "..." : ""}`
				);
			}
		});

		console.log();
		console.log("=".repeat(80));
		console.log("To restrict models, add entries like this to your MODELS env var:");
		console.log("=".repeat(80));
		console.log();
		console.log("MODELS: >");
		console.log("  [");
		console.log('    { "id": "model-id-1", "unlisted": true },');
		console.log('    { "id": "model-id-2", "unlisted": true },');
		console.log("    ...");
		console.log("  ]");
		console.log();

		// Generate a sample list of the first 10 models as unlisted (for testing)
		console.log("=".repeat(80));
		console.log("Sample: First 10 models marked as unlisted (for testing):");
		console.log("=".repeat(80));
		console.log();
		console.log("MODELS: >");
		console.log("  [");
		models.slice(0, 10).forEach((model: { id: string }) => {
			console.log(`    { "id": "${model.id}", "unlisted": true },`);
		});
		console.log("  ]");
		console.log();
	} catch (error) {
		console.error("Error fetching models:", error);
		process.exit(1);
	}
}

listAllModels();
