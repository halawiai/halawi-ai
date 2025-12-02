#!/usr/bin/env tsx
/**
 * Identify which models use Groq as their inference provider
 *
 * Usage:
 *   OPENAI_BASE_URL=https://router.huggingface.co/v1 OPENAI_API_KEY=your_key npx tsx scripts/identify-groq-models.ts
 */

const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://router.huggingface.co/v1";
const authToken = process.env.OPENAI_API_KEY || process.env.HF_TOKEN;

interface Model {
	id: string;
	description?: string;
	providers?: Array<{ provider: string; [key: string]: unknown }>;
}

async function identifyGroqModels() {
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

		// Find models that have Groq as a provider
		const groqModels: Model[] = [];
		const nonGroqModels: Model[] = [];

		allModels.forEach((model) => {
			const hasGroq = model.providers?.some((p) => p.provider?.toLowerCase().includes("groq"));

			if (hasGroq) {
				groqModels.push(model);
			} else {
				nonGroqModels.push(model);
			}
		});

		console.log("=".repeat(80));
		console.log("GROQ MODELS (Keep Enabled)");
		console.log("=".repeat(80));
		console.log(`\nTotal Groq models: ${groqModels.length}\n`);

		groqModels.forEach((model, index) => {
			const providers = model.providers?.map((p) => p.provider).join(", ") || "No providers";
			console.log(`${(index + 1).toString().padStart(3)}. ${model.id}`);
			console.log(`     Providers: ${providers}`);
		});

		console.log("\n\n");
		console.log("=".repeat(80));
		console.log("NON-GROQ MODELS (Will be Disabled)");
		console.log("=".repeat(80));
		console.log(`\nTotal non-Groq models: ${nonGroqModels.length}\n`);

		// Show first 20 non-Groq models
		nonGroqModels.slice(0, 20).forEach((model, index) => {
			console.log(`${(index + 1).toString().padStart(3)}. ${model.id}`);
		});

		if (nonGroqModels.length > 20) {
			console.log(`\n... and ${nonGroqModels.length - 20} more non-Groq models`);
		}

		// Generate list of Groq model IDs for configuration
		console.log("\n\n");
		console.log("=".repeat(80));
		console.log("GROQ MODEL IDs (for configuration)");
		console.log("=".repeat(80));
		console.log("\nGroq model IDs to keep enabled:\n");
		groqModels.forEach((model) => {
			console.log(`"${model.id}"`);
		});

		return {
			groqModels: groqModels.map((m) => m.id),
			nonGroqModels: nonGroqModels.map((m) => m.id),
		};
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	}
}

identifyGroqModels();
