import { z } from "zod";
import { openAICompletionToTextGenerationStream } from "./openAICompletionToTextGenerationStream";
import {
	openAIChatToTextGenerationSingle,
	openAIChatToTextGenerationStream,
} from "./openAIChatToTextGenerationStream";
import type { CompletionCreateParamsStreaming } from "openai/resources/completions";
import type {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";
import { buildPrompt } from "$lib/buildPrompt";
import { config } from "$lib/server/config";
import type { Endpoint } from "../endpoints";
import type OpenAI from "openai";
import { createImageProcessorOptionsValidator, makeImageProcessor } from "../images";
import { prepareMessagesWithFiles } from "$lib/server/textGeneration/utils/prepareFiles";
import { logger } from "$lib/server/logger";
import {
	isGroqRegionalEndpoint,
	getGroqGlobalEndpoint,
	isToolChoiceRequiredError,
} from "$lib/server/utils/groqEndpointFallback";
// uuid import removed (no tool call ids)

export const endpointOAIParametersSchema = z.object({
	weight: z.number().int().positive().default(1),
	model: z.any(),
	type: z.literal("openai"),
	baseURL: z.string().url().default("https://api.openai.com/v1"),
	// Canonical auth token is OPENAI_API_KEY; keep HF_TOKEN as legacy alias
	apiKey: z.string().default(config.OPENAI_API_KEY || config.HF_TOKEN || "sk-"),
	completion: z
		.union([z.literal("completions"), z.literal("chat_completions")])
		.default("chat_completions"),
	defaultHeaders: z.record(z.string()).optional(),
	defaultQuery: z.record(z.string()).optional(),
	extraBody: z.record(z.any()).optional(),
	multimodal: z
		.object({
			image: createImageProcessorOptionsValidator({
				supportedMimeTypes: [
					// Restrict to the most widely-supported formats
					"image/png",
					"image/jpeg",
				],
				preferredMimeType: "image/jpeg",
				maxSizeInMB: 1,
				maxWidth: 1024,
				maxHeight: 1024,
			}),
		})
		.default({}),
	/* enable use of max_completion_tokens in place of max_tokens */
	useCompletionTokens: z.boolean().default(false),
	streamingSupported: z.boolean().default(true),
});

export async function endpointOai(
	input: z.input<typeof endpointOAIParametersSchema>
): Promise<Endpoint> {
	const {
		baseURL,
		apiKey,
		completion,
		model,
		defaultHeaders,
		defaultQuery,
		multimodal,
		extraBody,
		useCompletionTokens,
		streamingSupported,
	} = endpointOAIParametersSchema.parse(input);

	let OpenAI;
	try {
		OpenAI = (await import("openai")).OpenAI;
	} catch (e) {
		throw new Error("Failed to import OpenAI", { cause: e });
	}

	// Store router metadata if captured
	let routerMetadata: { route?: string; model?: string; provider?: string } = {};

	// Custom fetch wrapper to capture response headers for router metadata
	const customFetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
		const response = await fetch(url, init);

		// Capture router headers if present (fallback for non-streaming)
		const routeHeader = response.headers.get("X-Router-Route");
		const modelHeader = response.headers.get("X-Router-Model");
		const providerHeader = response.headers.get("x-inference-provider");

		if (routeHeader && modelHeader) {
			routerMetadata = {
				route: routeHeader,
				model: modelHeader,
				provider: providerHeader || undefined,
			};
		} else if (providerHeader) {
			// Even without router metadata, capture provider info
			routerMetadata = {
				provider: providerHeader,
			};
		}

		return response;
	};

	// Convert regional Groq endpoints to global endpoint upfront
	const currentBaseURL = isGroqRegionalEndpoint(baseURL) ? getGroqGlobalEndpoint(baseURL) : baseURL;

	if (isGroqRegionalEndpoint(baseURL)) {
		logger.info(
			{ original: baseURL, converted: currentBaseURL },
			"[endpointOai] Converting regional Groq endpoint to global endpoint"
		);
	}

	const openai = new OpenAI({
		apiKey: apiKey || "sk-",
		baseURL: currentBaseURL,
		defaultHeaders: {
			...(config.PUBLIC_APP_NAME === "HuggingChat" && { "User-Agent": "huggingchat" }),
			...defaultHeaders,
		},
		defaultQuery,
		fetch: customFetch,
	});

	const imageProcessor = makeImageProcessor(multimodal.image);

	if (completion === "completions") {
		return async ({
			messages,
			preprompt,
			generateSettings,
			conversationId,
			locals,
			abortSignal,
		}) => {
			const prompt = await buildPrompt({
				messages,
				preprompt,
				model,
			});

			const parameters = { ...model.parameters, ...generateSettings };
			const body: CompletionCreateParamsStreaming = {
				model: model.id ?? model.name,
				prompt,
				stream: true,
				max_tokens: parameters?.max_tokens,
				stop: parameters?.stop,
				temperature: parameters?.temperature,
				top_p: parameters?.top_p,
				frequency_penalty: parameters?.frequency_penalty,
				presence_penalty: parameters?.presence_penalty,
			};

			const openAICompletion = await openai.completions.create(body, {
				body: { ...body, ...extraBody },
				headers: {
					"HALAWI-Conversation-ID": conversationId?.toString() ?? "",
					"X-use-cache": "false",
					...(locals?.token ? { Authorization: `Bearer ${locals.token}` } : {}),
				},
				signal: abortSignal,
			});

			return openAICompletionToTextGenerationStream(openAICompletion);
		};
	} else if (completion === "chat_completions") {
		return async ({
			messages,
			preprompt,
			generateSettings,
			conversationId,
			isMultimodal,
			locals,
			abortSignal,
		}) => {
			// Format messages for the chat API, handling multimodal content if supported
			let messagesOpenAI: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
				await prepareMessagesWithFiles(messages, imageProcessor, isMultimodal ?? model.multimodal);

			// Normalize preprompt and handle empty values
			const normalizedPreprompt = typeof preprompt === "string" ? preprompt.trim() : "";

			// Check if a system message already exists as the first message
			const hasSystemMessage = messagesOpenAI.length > 0 && messagesOpenAI[0]?.role === "system";

			if (hasSystemMessage) {
				// Prepend normalized preprompt to existing system content when non-empty
				if (normalizedPreprompt) {
					const userSystemPrompt =
						(typeof messagesOpenAI[0].content === "string"
							? (messagesOpenAI[0].content as string)
							: "") || "";
					messagesOpenAI[0].content =
						normalizedPreprompt + (userSystemPrompt ? "\n\n" + userSystemPrompt : "");
				}
			} else {
				// Insert a system message only if the preprompt is non-empty
				if (normalizedPreprompt) {
					messagesOpenAI = [{ role: "system", content: normalizedPreprompt }, ...messagesOpenAI];
				}
			}

			// Combine model defaults with request-specific parameters
			const parameters = { ...model.parameters, ...generateSettings };
			const modelId = model.id ?? model.name;

			// Enable browser search and code execution for OSS models matching the openai/gpt-oss-* namespace pattern
			// This strict prefix match ensures only intended OSS models enable these tools
			const isOssModel = typeof modelId === "string" && modelId.startsWith("openai/gpt-oss-");
			// browser_search and code_interpreter are Groq-specific tool types, so we use type assertion for compatibility
			const tools = isOssModel
				? ([
						{ type: "browser_search" },
						{ type: "code_interpreter" },
					] as unknown as OpenAI.Chat.Completions.ChatCompletionTool[])
				: undefined;
			// Use "auto" to let the model decide when to use tools, avoiding parse errors from forced tool usage
			// The model will intelligently use code execution when needed
			const toolChoice = isOssModel ? ("auto" as const) : undefined;

			// Build base body, ensuring tool_choice from extraBody doesn't override our setting
			const baseBody: ChatCompletionCreateParamsStreaming | ChatCompletionCreateParamsNonStreaming =
				{
					model: modelId,
					messages: messagesOpenAI,
					...(streamingSupported ? { stream: true as const } : { stream: false }),
					// Support two different ways of specifying token limits depending on the model
					...(useCompletionTokens
						? { max_completion_tokens: parameters?.max_tokens }
						: { max_tokens: parameters?.max_tokens }),
					stop: parameters?.stop,
					temperature: parameters?.temperature,
					top_p: parameters?.top_p,
					frequency_penalty: parameters?.frequency_penalty,
					presence_penalty: parameters?.presence_penalty,
					...(tools ? { tools } : {}),
					...(toolChoice ? { tool_choice: toolChoice } : {}),
				};

			// Merge extraBody but ensure our tool_choice setting takes precedence
			const body = {
				...baseBody,
				...extraBody,
				// Ensure our tool_choice setting is not overridden by extraBody
				...(toolChoice ? { tool_choice: toolChoice } : {}),
			} as ChatCompletionCreateParamsStreaming | ChatCompletionCreateParamsNonStreaming;

			// Handle both streaming and non-streaming responses with appropriate processors
			if (streamingSupported) {
				try {
					const openChatAICompletion = await openai.chat.completions.create(
						body as ChatCompletionCreateParamsStreaming,
						{
							body: { ...body, ...extraBody },
							headers: {
								"HALAWI-Conversation-ID": conversationId?.toString() ?? "",
								"X-use-cache": "false",
								...(locals?.token ? { Authorization: `Bearer ${locals.token}` } : {}),
							},
							signal: abortSignal,
						}
					);
					return openAIChatToTextGenerationStream(openChatAICompletion, () => routerMetadata);
				} catch (error) {
					// Handle tool_choice required errors by retrying with "auto"
					if (isToolChoiceRequiredError(error)) {
						logger.warn(
							{ model: modelId, error: String(error) },
							"[endpointOai] Tool choice required error, retrying with tool_choice: auto"
						);
						// Remove tool_choice from extraBody if present, then set to "auto"
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { tool_choice, ...extraBodyWithoutToolChoice } = extraBody || {};
						const bodyWithAutoToolChoice = {
							...body,
							tool_choice: "auto" as const,
						};
						const openChatAICompletion = await openai.chat.completions.create(
							bodyWithAutoToolChoice as ChatCompletionCreateParamsStreaming,
							{
								body: { ...bodyWithAutoToolChoice, ...extraBodyWithoutToolChoice },
								headers: {
									"HALAWI-Conversation-ID": conversationId?.toString() ?? "",
									"X-use-cache": "false",
									...(locals?.token ? { Authorization: `Bearer ${locals.token}` } : {}),
								},
								signal: abortSignal,
							}
						);
						return openAIChatToTextGenerationStream(openChatAICompletion, () => routerMetadata);
					}
					throw error;
				}
			} else {
				try {
					const openChatAICompletion = await openai.chat.completions.create(
						body as ChatCompletionCreateParamsNonStreaming,
						{
							body: { ...body, ...extraBody },
							headers: {
								"HALAWI-Conversation-ID": conversationId?.toString() ?? "",
								"X-use-cache": "false",
								...(locals?.token ? { Authorization: `Bearer ${locals.token}` } : {}),
							},
							signal: abortSignal,
						}
					);
					return openAIChatToTextGenerationSingle(openChatAICompletion, () => routerMetadata);
				} catch (error) {
					// Handle tool_choice required errors by retrying with "auto"
					if (isToolChoiceRequiredError(error)) {
						logger.warn(
							{ model: modelId, error: String(error) },
							"[endpointOai] Tool choice required error, retrying with tool_choice: auto"
						);
						// Remove tool_choice from extraBody if present, then set to "auto"
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { tool_choice, ...extraBodyWithoutToolChoice } = extraBody || {};
						const bodyWithAutoToolChoice = {
							...body,
							tool_choice: "auto" as const,
						};
						const openChatAICompletion = await openai.chat.completions.create(
							bodyWithAutoToolChoice as ChatCompletionCreateParamsNonStreaming,
							{
								body: { ...bodyWithAutoToolChoice, ...extraBodyWithoutToolChoice },
								headers: {
									"HALAWI-Conversation-ID": conversationId?.toString() ?? "",
									"X-use-cache": "false",
									...(locals?.token ? { Authorization: `Bearer ${locals.token}` } : {}),
								},
								signal: abortSignal,
							}
						);
						return openAIChatToTextGenerationSingle(openChatAICompletion, () => routerMetadata);
					}
					throw error;
				}
			}
		};
	} else {
		throw new Error("Invalid completion type");
	}
}
