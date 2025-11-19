# Chat UI - Codebase Context

## Overview

Chat UI is a modern, full-stack chat interface for Large Language Models (LLMs). It's built with SvelteKit and powers the HuggingChat application on hf.co/chat. The application provides a ChatGPT-like interface that connects to OpenAI-compatible APIs, supports multiple models, conversation management, file uploads, tool calling via MCP (Model Context Protocol), and intelligent routing.

## Technology Stack

### Frontend
- **SvelteKit 2.21.1** - Full-stack framework with SSR
- **Svelte 5.33.3** - Reactive UI framework (using runes: `$state`, `$derived`, `$effect`)
- **TypeScript 5.5.0** - Type safety
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Tailwind Typography** - For markdown rendering
- **Tailwind Scrollbar** - Custom scrollbar styling
- **Highlight.js 11.7.0** - Code syntax highlighting
- **Marked 12.0.1** - Markdown parsing
- **KaTeX 0.16.21** - Math rendering
- **DOMPurify 3.2.4** - HTML sanitization
- **Bits UI 2.14.2** - Headless UI components
- **Date-fns 2.29.3** - Date utilities
- **Unplugin Icons** - Icon system (Iconify)

### Backend
- **SvelteKit** - Server-side rendering and API routes
- **Elysia 1.3.2** - Type-safe API framework (via Eden Treaty)
- **MongoDB 5.8.0** - Database (with GridFS for file storage)
- **MongoDB Memory Server** - In-memory MongoDB for development/testing
- **Pino 9.0.0** - Structured logging
- **Zod 3.22.3** - Schema validation
- **SuperJSON 2.2.2** - Enhanced JSON serialization (handles Dates, ObjectIds, etc.)

### AI/LLM Integration
- **OpenAI SDK 4.44.0** - OpenAI-compatible API client
- **@huggingface/inference 4.11.3** - Hugging Face API integration
- **@huggingface/hub 2.2.0** - Hugging Face Hub access
- **@modelcontextprotocol/sdk 1.21.1** - MCP (Model Context Protocol) support

### Infrastructure & DevOps
- **Vite 6.3.5** - Build tool and dev server
- **Docker** - Containerization
- **Node.js 24** - Runtime
- **Helm Charts** - Kubernetes deployment (in `/chart`)

### Testing
- **Vitest 3.1.4** - Test framework
- **Playwright 1.55.1** - Browser testing
- **MongoDB Memory Server** - Test database

### Other Key Libraries
- **Sharp 0.33.4** - Image processing
- **Satori 0.10.11** - SVG-to-image conversion (for thumbnails)
- **Nanoid 5.0.9** - ID generation
- **UUID 10.0.0** - UUID generation
- **OpenID Client 5.4.2** - OAuth authentication
- **Prom Client 15.1.3** - Prometheus metrics
- **AWS SDK 3.925.0** - AWS integration (credentials)

## Architecture

### Project Structure

```
chat-ui/
├── src/
│   ├── routes/              # SvelteKit routes (file-based routing)
│   │   ├── +page.svelte     # Home page
│   │   ├── +layout.svelte   # Root layout
│   │   ├── conversation/   # Conversation pages
│   │   ├── api/             # API endpoints
│   │   ├── models/          # Model listing pages
│   │   └── settings/        # Settings pages
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   │   ├── chat/        # Chat-specific components
│   │   │   ├── icons/       # Icon components
│   │   │   └── mcp/         # MCP-related components
│   │   ├── server/          # Server-only code
│   │   │   ├── api/         # Elysia API routes
│   │   │   ├── endpoints/   # LLM endpoint adapters
│   │   │   ├── textGeneration/  # Text generation logic
│   │   │   ├── router/      # LLM routing logic
│   │   │   ├── mcp/         # MCP server integration
│   │   │   └── database.ts  # MongoDB connection
│   │   ├── stores/          # Svelte stores (state management)
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── hooks.server.ts      # Server hooks (auth, CSRF, etc.)
│   └── app.html             # HTML template
├── static/                  # Static assets (favicons, logos)
├── chart/                   # Helm charts for Kubernetes
├── scripts/                 # Utility scripts
└── models/                  # Model definitions (placeholder)
```

### Key Architectural Patterns

1. **File-based Routing**: SvelteKit's routing system
2. **API-First**: Backend API built with Elysia, frontend uses Eden Treaty for type-safe API calls
3. **Server-Side Rendering**: Initial page loads are SSR'd for better SEO and performance
4. **Streaming**: Real-time message streaming via Server-Sent Events (SSE)
5. **State Management**: Svelte stores for client-side state, MongoDB for persistence
6. **Type Safety**: End-to-end TypeScript with shared types

## Core Features

### 1. Chat Interface
- Real-time streaming responses
- Message history and conversation management
- Markdown rendering with syntax highlighting
- Math rendering (KaTeX)
- Code blocks with copy functionality
- File uploads (images, documents)
- Multimodal input support

### 2. Model Management
- Dynamic model discovery from `/models` endpoint
- Model switching within conversations
- Custom prompts per model
- Model metadata display
- Support for OpenAI-compatible APIs

### 3. LLM Router (Omni)
- Intelligent model selection using Arch Router (katanemo/Arch-Router-1.5B)
- Route-based model selection with fallbacks
- Multimodal routing (auto-selects multimodal models for images)
- Tools routing (auto-selects tool-capable models when MCP tools are active)
- Configurable via `LLM_ROUTER_ROUTES_PATH` JSON file

### 4. MCP (Model Context Protocol) Integration
- Tool calling via MCP servers
- Pre-configured servers via `MCP_SERVERS` env var
- User-configurable servers in UI
- Tool invocation UI with progress tracking
- Automatic model selection for tool-capable models

### 5. Authentication & Authorization
- OAuth integration (Hugging Face, configurable)
- Session management with MongoDB
- Admin token support
- Automatic login option
- User settings per session/user

### 6. Conversation Management
- Create, edit, delete conversations
- Share conversations via public links
- Conversation statistics
- Pagination for conversation lists
- Search and filtering

### 7. File Handling
- File uploads (GridFS storage)
- Image processing (Sharp)
- File type detection
- Attachment support in messages
- URL-based file loading

### 8. Background Features
- Title generation for conversations
- Thumbnail generation for shared conversations
- Background job processing
- Statistics aggregation

## Database Schema (MongoDB)

### Collections

1. **conversations** - Chat conversations
   - `_id`, `sessionId`, `userId`, `title`, `model`, `messages[]`, `preprompt`, `createdAt`, `updatedAt`
   - Indexes: `sessionId + updatedAt`, `userId + updatedAt`, `messages.createdAt`

2. **users** - User accounts
   - `_id`, `hfUserId`, `username`, `sessionId`, `isAdmin`
   - Indexes: `hfUserId` (unique), `sessionId` (unique), `username`

3. **settings** - User/session settings
   - `sessionId`, `userId`, `activeModel`, `customPrompts`, `multimodalOverrides`, `toolsOverrides`, `assistants[]`
   - Indexes: `sessionId` (unique), `userId` (unique)

4. **sessions** - User sessions
   - `sessionId`, `expiresAt`, `updatedAt`
   - TTL index on `expiresAt`

5. **sharedConversations** - Public conversation shares
   - `hash` (unique), `conversationId`, `createdAt`

6. **abortedGenerations** - Aborted generation tracking
   - `conversationId` (unique), `updatedAt`
   - TTL index (30 seconds)

7. **messageEvents** - Message event tracking
   - `expiresAt` (TTL index)

8. **assistants** - Assistant definitions
   - `_id`, `createdById`, `modelId`, `userCount`, `review`, `searchTokens`

9. **conversationStats** - Aggregated conversation statistics
   - `type`, `date.field`, `date.span`, `date.at`, `distinct`

10. **files** (GridFS) - File storage
    - Binary file storage with metadata

11. **config** - Runtime configuration (when `ENABLE_CONFIG_MANAGER=true`)
    - `key` (unique), `value`

12. **semaphores** - Distributed locks
    - `key` (unique), `deleteAt` (TTL)

13. **tokenCaches** - Token caching
    - `tokenHash`, `createdAt` (TTL: 5 minutes)

## API Structure

### API Client (Frontend)
- Uses **Eden Treaty** for type-safe API calls
- Located in `src/lib/APIClient.ts`
- Base URL: `/api/v2`
- Uses SuperJSON for serialization (handles Dates, ObjectIds)

### API Routes (Backend)
Located in `src/lib/server/api/` using Elysia:

- **Groups**:
  - `conversations.ts` - Conversation CRUD
  - `models.ts` - Model listing
  - `user.ts` - User settings, authentication
  - `misc.ts` - Miscellaneous endpoints
  - `debug.ts` - Debug endpoints

### Key Endpoints

- `POST /conversation` - Create conversation
- `POST /conversation/[id]` - Send message (streaming)
- `GET /conversations` - List conversations (paginated)
- `GET /models` - List available models
- `GET /user` - Get current user
- `GET /user/settings` - Get user settings
- `PATCH /user/settings` - Update settings
- `GET /public-config` - Get public configuration
- `GET /feature-flags` - Get feature flags

## Key Workflows

### Message Generation Flow

1. **User sends message** → `POST /conversation/[id]`
2. **Server loads conversation** from MongoDB
3. **Preprocess messages** (handle attachments, format for endpoint)
4. **Route selection** (if using Omni router):
   - Check for multimodal input → use multimodal route
   - Check for active MCP tools → use tools route
   - Otherwise → call Arch Router for route selection
5. **Text generation**:
   - If MCP tools active → `runMcpFlow()` (handles tool calling loop)
   - Otherwise → `generate()` (standard generation)
6. **Stream updates** via SSE:
   - `MessageUpdateType.Stream` - Token updates
   - `MessageUpdateType.Status` - Status updates
   - `MessageUpdateType.Tool` - Tool invocation updates
   - `MessageUpdateType.RouterMetadata` - Router info
   - `MessageUpdateType.Reasoning` - Reasoning updates
   - `MessageUpdateType.FinalAnswer` - Final message
7. **Persist conversation** to MongoDB
8. **Generate title** (background, if needed)

### MCP Tool Calling Flow

1. **Check if tools enabled** and MCP servers active
2. **Resolve router target** (select tool-capable model)
3. **Call model** with tool definitions
4. **Model returns tool calls**
5. **Execute tools** via MCP servers
6. **Send results back** to model
7. **Repeat** (up to 10 iterations) until model returns final answer

### Router Flow (Omni)

1. **User selects "Omni" model**
2. **Check input type**:
   - Has images? → Use `LLM_ROUTER_MULTIMODAL_MODEL`
   - Has active MCP tools? → Use `LLM_ROUTER_TOOLS_MODEL`
3. **Otherwise**: Call Arch Router (`LLM_ROUTER_ARCH_BASE_URL`)
4. **Arch returns route name**
5. **Resolve route** from `LLM_ROUTER_ROUTES_PATH` JSON
6. **Get candidate models** (primary + fallbacks)
7. **Try candidates** in order until one succeeds
8. **Emit router metadata** to UI (route name, model used)

## Configuration

### Environment Variables

#### Required
- `MONGODB_URL` - MongoDB connection string
- `OPENAI_BASE_URL` - Base URL for OpenAI-compatible API
- `OPENAI_API_KEY` - API key (or `HF_TOKEN` as legacy alias)

#### Optional - Theming
- `PUBLIC_APP_NAME` - App name (default: "HALAWI")
- `PUBLIC_APP_ASSETS` - Asset folder name (`halawi` or `huggingchat`)
- `PUBLIC_APP_DESCRIPTION` - App description
- `PUBLIC_APP_DATA_SHARING` - Enable data sharing toggle

#### Optional - LLM Router
- `LLM_ROUTER_ROUTES_PATH` - Path to routes JSON file
- `LLM_ROUTER_ARCH_BASE_URL` - Arch Router endpoint
- `LLM_ROUTER_ARCH_MODEL` - Arch Router model (default: "router/omni")
- `LLM_ROUTER_ARCH_TIMEOUT_MS` - Timeout (default: 10000)
- `LLM_ROUTER_OTHER_ROUTE` - Route for "other" category (default: "casual_conversation")
- `LLM_ROUTER_FALLBACK_MODEL` - Fallback model ID
- `LLM_ROUTER_ENABLE_MULTIMODAL` - Enable multimodal routing
- `LLM_ROUTER_MULTIMODAL_MODEL` - Model for multimodal
- `LLM_ROUTER_ENABLE_TOOLS` - Enable tools routing
- `LLM_ROUTER_TOOLS_MODEL` - Model for tools
- `PUBLIC_LLM_ROUTER_ALIAS_ID` - Router alias ID (default: "omni")
- `PUBLIC_LLM_ROUTER_DISPLAY_NAME` - Display name (default: "Omni")

#### Optional - MCP
- `MCP_SERVERS` - JSON array of MCP server configs
- `MCP_FORWARD_HF_USER_TOKEN` - Forward HF token to MCP servers

#### Optional - Authentication
- `HF_OAUTH_CLIENT_ID` - Hugging Face OAuth client ID
- `HF_OAUTH_CLIENT_SECRET` - Hugging Face OAuth client secret
- `AUTOMATIC_LOGIN` - Auto-redirect to OAuth
- `ADMIN_API_SECRET` - Admin API secret

#### Optional - Other
- `MONGODB_DB_NAME` - Database name (default: "chat-ui")
- `MONGODB_DIRECT_CONNECTION` - Direct connection mode
- `MONGO_STORAGE_PATH` - Path for in-memory MongoDB persistence
- `PUBLIC_ORIGIN` - Public origin URL
- `ALLOW_IFRAME` - Allow iframe embedding
- `METRICS_ENABLED` - Enable Prometheus metrics
- `ENABLE_CONFIG_MANAGER` - Enable runtime config management
- `PUBLIC_GOOGLE_ANALYTICS_ID` - Google Analytics ID
- `PUBLIC_PLAUSIBLE_SCRIPT_URL` - Plausible analytics URL

### Config Manager

When `ENABLE_CONFIG_MANAGER=true`, configuration can be managed at runtime via MongoDB `config` collection. This allows updating config without redeployment.

## Deployment

### Docker
- Dockerfile supports building with/without embedded MongoDB
- Uses Node.js 24-slim base image
- Entrypoint script handles startup
- Environment variables passed via `-e` flags

### Kubernetes (Helm)
- Helm charts in `/chart` directory
- Supports dev/prod environments
- Includes HPA, service monitors, network policies

### Development
- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Run tests

## Key Components

### Chat Components (`src/lib/components/chat/`)
- `ChatWindow.svelte` - Main chat interface
- `ChatInput.svelte` - Message input with file upload
- `ChatMessage.svelte` - Individual message display
- `MarkdownRenderer.svelte` - Markdown rendering
- `CodeBlock.svelte` - Code block with highlighting
- `ToolUpdate.svelte` - MCP tool invocation display
- `FileDropzone.svelte` - File drag-and-drop
- `ModelSwitch.svelte` - Model selection UI

### Navigation
- `NavMenu.svelte` - Sidebar navigation
- `MobileNav.svelte` - Mobile navigation
- `ExpandNavigation.svelte` - Collapse/expand toggle

### Modals
- `WelcomeModal.svelte` - First-time welcome
- `ShareConversationModal.svelte` - Share conversation
- `EditConversationModal.svelte` - Edit conversation title
- `SystemPromptModal.svelte` - Edit system prompt
- `SubscribeModal.svelte` - Subscription modal

### MCP Components
- `src/lib/components/mcp/` - MCP server management UI

## State Management

### Svelte Stores (`src/lib/stores/`)
- `settings.ts` - User settings (active model, custom prompts, etc.)
- `errors.ts` - Global error state
- `loading.ts` - Loading state
- `isAborted.ts` - Abort state
- `pendingMessage.ts` - Pending message (temp storage)
- `shareModal.ts` - Share modal state
- `titleUpdate.ts` - Title update state
- `backgroundGenerations.ts` - Background generation state
- `mcpServers.ts` - MCP server state

## Testing

- **Client tests**: Browser-based with Playwright
- **SSR tests**: Node environment
- **Server tests**: Node environment
- Test setup files in `scripts/setups/`

## Security Features

- CSRF protection (custom implementation in `hooks.server.ts`)
- Origin validation for POST requests
- Session-based authentication
- Admin token support
- Content Security Policy (CSP) headers
- HTML sanitization (DOMPurify)
- URL safety checks

## Logging

- Structured logging with Pino
- Log levels: debug, info, warn, error
- Request/response logging
- Error tracking with error IDs

## Metrics

- Prometheus metrics (when `METRICS_ENABLED=true`)
- Metrics server on separate port
- Conversation statistics aggregation

## Migration System

- Database migrations in `src/lib/migrations/`
- Migration results stored in `migrationResults` collection
- Automatic migration on startup

---

## Change Log

This section tracks significant changes made to the codebase.

### [Date: 2025-11-19] - Initial Context Documentation
- Created comprehensive context.md file
- Documented architecture, tech stack, features, and workflows

### [Date: 2025-11-19] - Configured Groq as LLM Provider
- Changed LLM provider from Hugging Face router to Groq
- Updated `.env.local` with Groq configuration:
  - `OPENAI_BASE_URL=https://api.me-central-1.groqcloud.com/openai/v1`
  - `OPENAI_API_KEY` set to Groq API key
- Note: Base URL should not include `/chat/completions` endpoint as the OpenAI SDK appends it automatically

---

## Notes

- The codebase uses Svelte 5 runes (`$state`, `$derived`, `$effect`) instead of the older store syntax
- API client uses Eden Treaty for end-to-end type safety
- Streaming uses Server-Sent Events (SSE) with JSON message updates
- MongoDB can run in-memory for development (MongoDB Memory Server)
- File storage uses GridFS for large files
- The router system supports intelligent model selection based on input type and available tools

