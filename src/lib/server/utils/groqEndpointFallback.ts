/**
 * Utility functions for handling Groq regional endpoint fallback to global endpoint
 */

const GROQ_GLOBAL_ENDPOINT = "https://api.groq.com/openai/v1";
const GROQ_REGIONAL_PATTERN = /^https:\/\/api\.([a-z0-9-]+\.)?groqcloud\.com\/openai\/v1$/;

/**
 * Checks if a URL is a Groq regional endpoint
 */
export function isGroqRegionalEndpoint(url: string): boolean {
	try {
		new URL(url);
		return GROQ_REGIONAL_PATTERN.test(url);
	} catch {
		return false;
	}
}

/**
 * Converts a Groq regional endpoint to the global endpoint
 */
export function getGroqGlobalEndpoint(url: string): string {
	if (isGroqRegionalEndpoint(url)) {
		return GROQ_GLOBAL_ENDPOINT;
	}
	return url;
}

/**
 * Checks if an error is related to regional endpoint issues
 */
export function isRegionalEndpointError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const errorMessage = error.message.toLowerCase();
	const errorString = String(error).toLowerCase();

	// Check for common regional endpoint error patterns
	const patterns = [
		"regional",
		"region",
		"endpoint",
		"groqcloud",
		"me-central",
		"unavailable",
		"not found",
		"404",
		"503",
		"502",
	];

	return patterns.some(
		(pattern) => errorMessage.includes(pattern) || errorString.includes(pattern)
	);
}

/**
 * Checks if an error is related to tool_choice being required but model didn't call a tool
 * or output parsing failures that might be caused by forced tool usage
 */
export function isToolChoiceRequiredError(error: unknown): boolean {
	if (!error) return false;

	// Check if it's an APIError with the specific code (can be at top level or nested)
	const checkForCode = (obj: unknown, depth = 0): boolean => {
		if (depth > 5) return false; // Prevent infinite recursion
		if (obj && typeof obj === "object") {
			const errorObj = obj as Record<string, unknown>;
			// Check top-level code
			if (errorObj.code === "tool_use_failed" || errorObj.code === "output_parse_failed") {
				return true;
			}
			// Check nested error.code (multiple levels)
			if (errorObj.error) {
				if (checkForCode(errorObj.error, depth + 1)) {
					return true;
				}
			}
			// Check for OpenAI SDK error structure
			if (errorObj.cause && checkForCode(errorObj.cause, depth + 1)) {
				return true;
			}
		}
		return false;
	};

	if (checkForCode(error)) {
		return true;
	}

	// Convert error to string for pattern matching
	let errorString = "";
	let errorMessage = "";

	if (error instanceof Error) {
		errorMessage = error.message;
		errorString = String(error);
	} else if (error && typeof error === "object") {
		// Try to extract message from error object
		const err = error as Record<string, unknown>;
		if (typeof err.message === "string") {
			errorMessage = err.message;
		}
		if (err.error && typeof err.error === "object") {
			const nestedErr = err.error as Record<string, unknown>;
			if (typeof nestedErr.message === "string") {
				errorMessage = nestedErr.message;
			}
		}
		errorString = JSON.stringify(error);
	} else {
		errorString = String(error);
	}

	const lowerMessage = errorMessage.toLowerCase();
	const lowerString = errorString.toLowerCase();

	// Check for tool_choice required error patterns and parse failures
	const patterns = [
		"tool choice is required",
		"tool_choice is required",
		"tool_use_failed",
		"output_parse_failed",
		"parsing failed",
		"could not be parsed",
		"did not call a tool",
		"model did not call a tool",
	];

	return patterns.some(
		(pattern) => lowerMessage.includes(pattern) || lowerString.includes(pattern)
	);
}
