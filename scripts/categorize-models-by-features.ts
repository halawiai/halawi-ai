#!/usr/bin/env tsx
/**
 * Categorize models from dev.yaml by their capabilities:
 * - Premium: Models with tool support (supportsTools)
 * - Text: Regular text-only models
 * - Vision: Multimodal models (vision/image support)
 * - Audio: Audio/transcription models
 */

import { readFileSync } from "fs";
import { join } from "path";

interface ModelConfig {
	id: string;
	description?: string;
	multimodal?: boolean;
	supportsTools?: boolean;
	unlisted?: boolean;
}

// Read dev.yaml
const devYamlPath = join(process.cwd(), "chart/env/dev.yaml");
const yamlContent = readFileSync(devYamlPath, "utf-8");

// Extract MODELS array (between MODELS: > and the next top-level key)
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
	.replace(/,\s*$/, ""); // Remove trailing comma

const models: ModelConfig[] = JSON.parse(`[${modelsJson}]`);

// Categorize models based on ID patterns and descriptions
function categorizeModel(model: ModelConfig): {
	premium: boolean;
	vision: boolean;
	audio: boolean;
} {
	const id = model.id.toLowerCase();
	const desc = (model.description || "").toLowerCase();

	// Vision indicators
	const visionIndicators = [
		"vl-",
		"-vl",
		"vision",
		"multimodal",
		"image",
		"visual",
		"4.5v",
		"4.1v",
		"scout",
		"maverick",
		"gemma-3",
		"ernie-4.5-vl",
		"aya-vision",
		"command-a-vision",
		"command-a-reasoning",
	];

	// Premium/Tool support indicators
	const premiumIndicators = [
		"tool",
		"function calling",
		"agent",
		"gpt-oss",
		"glm-4.6",
		"deepseek-v3",
		"kimi-k2",
		"qwen3-coder",
		"kat-dev",
	];

	// Audio indicators
	const audioIndicators = ["whisper", "audio", "transcription", "speech"];

	const isVision =
		visionIndicators.some((indicator) => id.includes(indicator) || desc.includes(indicator)) ||
		model.multimodal === true;

	const isPremium =
		premiumIndicators.some((indicator) => id.includes(indicator) || desc.includes(indicator)) ||
		model.supportsTools === true;

	const isAudio = audioIndicators.some(
		(indicator) => id.includes(indicator) || desc.includes(indicator)
	);

	return {
		premium: isPremium,
		vision: isVision,
		audio: isAudio,
	};
}

// Categorize all models
const premium: string[] = [];
const text: string[] = [];
const vision: string[] = [];
const audio: string[] = [];
const seen = new Set<string>();

for (const model of models) {
	if (model.unlisted) continue;
	if (seen.has(model.id)) continue; // Skip duplicates
	seen.add(model.id);

	const cat = categorizeModel(model);

	if (cat.audio) {
		audio.push(model.id);
	} else if (cat.vision) {
		vision.push(model.id);
	} else if (cat.premium) {
		premium.push(model.id);
	} else {
		text.push(model.id);
	}
}

// Sort each category
premium.sort();
text.sort();
vision.sort();
audio.sort();

// Output documentation
const totalModels = new Set(models.filter((m) => !m.unlisted).map((m) => m.id)).size;
console.log("# Model Documentation\n");
console.log("**Source:** Models configured in `chart/env/dev.yaml`\n");
console.log("**Total Models:**", totalModels, "\n");

console.log("## Premium Reasoning Models");
console.log("High-performance models with full tool support for complex reasoning tasks.\n");
console.log("| Model ID |");
console.log("|----------|");
for (const id of premium) {
	console.log(`| \`${id}\` |`);
}
console.log();

console.log("## Text Chat Models");
console.log("Fast, efficient text-only models without tool support.\n");
console.log("| Model ID |");
console.log("|----------|");
for (const id of text) {
	console.log(`| \`${id}\` |`);
}
console.log();

console.log("## Vision Models");
console.log("Models with image understanding capabilities.\n");
console.log("| Model ID |");
console.log("|----------|");
for (const id of vision) {
	console.log(`| \`${id}\` |`);
}
console.log();

if (audio.length > 0) {
	console.log("## Audio Transcription Models");
	console.log("Speech-to-text models for voice input.\n");
	console.log("| Model ID |");
	console.log("|----------|");
	for (const id of audio) {
		console.log(`| \`${id}\` |`);
	}
	console.log();
}

// Also output in the format requested (comma-separated)
console.log("---\n");
console.log("## Quick Reference (Comma-separated)\n");
console.log("**Premium:**", premium.join(", "));
console.log();
console.log("**Text:**", text.join(", "));
console.log();
console.log("**Vision:**", vision.join(", "));
console.log();
if (audio.length > 0) {
	console.log("**Audio:**", audio.join(", "));
}
