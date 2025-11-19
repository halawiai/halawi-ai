import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const sizes = [36, 48, 72, 96, 128, 144, 192, 256, 512];
const svgPath = join(process.cwd(), "static/halawi/icon.svg");
const outputDir = join(process.cwd(), "static/halawi");

async function generateIcons() {
	const svgBuffer = readFileSync(svgPath);

	// Generate all icon sizes
	for (const size of sizes) {
		const outputPath = join(outputDir, `icon-${size}x${size}.png`);
		await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
		console.log(`Generated ${outputPath}`);
	}

	// Generate apple-touch-icon (typically 180x180)
	const appleTouchPath = join(outputDir, "apple-touch-icon.png");
	await sharp(svgBuffer).resize(180, 180).png().toFile(appleTouchPath);
	console.log(`Generated ${appleTouchPath}`);

	// Generate favicon.ico (16x16 and 32x32)
	const faviconPath = join(outputDir, "favicon.ico");
	await sharp(svgBuffer).resize(32, 32).png().toFile(faviconPath);
	console.log(`Generated ${faviconPath}`);

	console.log("All icons generated successfully!");
}

generateIcons().catch(console.error);
