#!/usr/bin/env tsx
/**
 * Restrict all models except Groq models by setting unlisted: true for non-Groq models
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/restrict-to-groq-only.ts
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

interface ModelConfig {
	id: string;
	description?: string;
	unlisted?: boolean;
	[key: string]: unknown;
}

async function restrictToGroqOnly() {
	try {
		console.log("Step 1: Fetching models from API to identify Groq models...\n");

		const response = await fetch(`${OPENAI_BASE_URL}/models`, {
			headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
		}

		const json = await response.json();
		const allModels: Model[] = json.data || [];

		// Identify Groq models
		const groqModelIds = new Set<string>();
		allModels.forEach((model) => {
			const hasGroq = model.providers?.some((p) => p.provider?.toLowerCase().includes("groq"));
			if (hasGroq) {
				groqModelIds.add(model.id);
			}
		});

		console.log(`Found ${groqModelIds.size} Groq models:\n`);
		Array.from(groqModelIds)
			.sort()
			.forEach((id) => {
				console.log(`  - ${id}`);
			});
		console.log();

		// Process both dev.yaml and prod.yaml
		const files = [
			{ path: join(process.cwd(), "chart/env/dev.yaml"), name: "dev.yaml" },
			{ path: join(process.cwd(), "chart/env/prod.yaml"), name: "prod.yaml" },
		];

		for (const file of files) {
			console.log(`\nStep 2: Processing ${file.name}...\n`);

			const yamlContent = readFileSync(file.path, "utf-8");

			// Extract MODELS array
			const modelsMatch = yamlContent.match(/MODELS:\s*>\s*\n\s*\[([\s\S]*?)\]\s*\n/);
			if (!modelsMatch) {
				console.error(`Could not find MODELS array in ${file.name}`);
				continue;
			}

			// Parse JSON array
			const modelsJson = modelsMatch[1]
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line && !line.startsWith("//"))
				.join("\n")
				.replace(/,\s*$/, "");

			const models: ModelConfig[] = JSON.parse(`[${modelsJson}]`);

			// Update models: set unlisted: true for non-Groq models
			let updatedCount = 0;
			let groqCount = 0;

			const updatedModels = models.map((model) => {
				const isGroq = groqModelIds.has(model.id);

				if (isGroq) {
					groqCount++;
					// Ensure Groq models are enabled (remove unlisted or set to false)
					const rest = { ...model };
					delete rest.unlisted;
					return rest;
				} else {
					updatedCount++;
					// Set unlisted: true for non-Groq models
					return {
						...model,
						unlisted: true,
					};
				}
			});

			console.log(`  - Groq models (enabled): ${groqCount}`);
			console.log(`  - Non-Groq models (disabled): ${updatedCount}`);
			console.log(`  - Total models: ${models.length}`);

			// Format updated models array with proper indentation
			const formattedModels = updatedModels
				.map((model) => {
					const json = JSON.stringify(model, null, 2)
						.split("\n")
						.map((line, i) => (i === 0 ? line : "      " + line))
						.join("\n");
					return json;
				})
				.join(",\n");

			// Replace the MODELS section
			const newModelsSection = `  MODELS: > 
    [
${formattedModels}
    ]`;

			const updatedContent = yamlContent.replace(
				/MODELS:\s*>\s*\n\s*\[[\s\S]*?\]\s*\n/,
				newModelsSection + "\n"
			);

			// Write back to file
			writeFileSync(file.path, updatedContent, "utf-8");
			console.log(`  ✓ Updated ${file.name}`);
		}

		console.log("\n" + "=".repeat(80));
		console.log("SUCCESS!");
		console.log("=".repeat(80));
		console.log("\nAll non-Groq models have been disabled (unlisted: true)");
		console.log("All Groq models remain enabled");
		console.log("\nNext steps:");
		console.log("  1. Review the changes in chart/env/dev.yaml and chart/env/prod.yaml");
		console.log("  2. Restart your application for changes to take effect");
		console.log("  3. Verify by visiting /models page - only Groq models should be visible");
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

restrictToGroqOnly();
