#!/usr/bin/env tsx
/**
 * Script to review all available models and compare with config
 * This helps identify which models to restrict
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/review-models.ts
 */

import * as fs from "fs";
import * as path from "path";

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

// Parse models from dev.yaml
function getModelsFromConfig(filePath: string): string[] {
	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const modelsMatch = content.match(/MODELS: >\s*\n\s*\[([\s\S]*?)\]/);
		if (!modelsMatch) return [];

		const modelsArray = modelsMatch[1];
		const idMatches = modelsArray.matchAll(/"id":\s*"([^"]+)"/g);
		return Array.from(idMatches, (m) => m[1]);
	} catch (error) {
		console.error(`Error reading config file: ${error}`);
		return [];
	}
}

async function reviewModels() {
	try {
		console.log(`Fetching models from: ${OPENAI_BASE_URL}/models\n`);

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const apiModels = json.data || [];

		// Get models from config files
		const devConfigPath = path.join(process.cwd(), "chart/env/dev.yaml");
		const prodConfigPath = path.join(process.cwd(), "chart/env/prod.yaml");

		const devModelIds = getModelsFromConfig(devConfigPath);
		const prodModelIds = getModelsFromConfig(prodConfigPath);

		const devModelSet = new Set(devModelIds);
		const prodModelSet = new Set(prodModelIds);

		console.log("=".repeat(80));
		console.log("MODEL SUMMARY");
		console.log("=".repeat(80));
		console.log(`Total models from API:        ${apiModels.length}`);
		console.log(`Models in dev.yaml:           ${devModelIds.length}`);
		console.log(`Models in prod.yaml:          ${prodModelIds.length}`);
		console.log();

		// Find models in API but not in config
		const notInDev = apiModels.filter((m: { id: string }) => !devModelSet.has(m.id));
		const notInProd = apiModels.filter((m: { id: string }) => !prodModelSet.has(m.id));

		if (notInDev.length > 0) {
			console.log("=".repeat(80));
			console.log(`MODELS IN API BUT NOT IN dev.yaml (${notInDev.length} models):`);
			console.log("=".repeat(80));
			notInDev.forEach((model: { id: string; description?: string }, index: number) => {
				console.log(`${(index + 1).toString().padStart(3)}. ${model.id}`);
				if (model.description) {
					console.log(
						`     ${model.description.substring(0, 70)}${model.description.length > 70 ? "..." : ""}`
					);
				}
			});
			console.log();
		}

		if (notInProd.length > 0) {
			console.log("=".repeat(80));
			console.log(`MODELS IN API BUT NOT IN prod.yaml (${notInProd.length} models):`);
			console.log("=".repeat(80));
			notInProd.forEach((model: { id: string; description?: string }, index: number) => {
				console.log(`${(index + 1).toString().padStart(3)}. ${model.id}`);
				if (model.description) {
					console.log(
						`     ${model.description.substring(0, 70)}${model.description.length > 70 ? "..." : ""}`
					);
				}
			});
			console.log();
		}

		// List all models from API
		console.log("=".repeat(80));
		console.log("ALL MODELS FROM API (currently visible unless unlisted):");
		console.log("=".repeat(80));
		console.log();

		apiModels.forEach((model: { id: string; description?: string }, index: number) => {
			const inConfig = devModelSet.has(model.id) ? "✓" : " ";
			console.log(`${(index + 1).toString().padStart(3)}. [${inConfig}] ${model.id}`);
			if (model.description) {
				console.log(
					`     ${model.description.substring(0, 70)}${model.description.length > 70 ? "..." : ""}`
				);
			}
		});

		console.log();
		console.log("=".repeat(80));
		console.log("HOW TO RESTRICT MODELS:");
		console.log("=".repeat(80));
		console.log();
		console.log("Add entries to the MODELS array in chart/env/dev.yaml or chart/env/prod.yaml:");
		console.log();
		console.log('  { "id": "model-id-here", "unlisted": true },');
		console.log();
		console.log("Example - to hide the first 5 models not in config:");
		console.log();
		if (notInDev.length > 0) {
			console.log("MODELS: >");
			console.log("  [");
			notInDev.slice(0, 5).forEach((model: { id: string }) => {
				console.log(`    { "id": "${model.id}", "unlisted": true },`);
			});
			console.log("    ... (your existing model entries) ...");
			console.log("  ]");
		}
		console.log();
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

reviewModels();
