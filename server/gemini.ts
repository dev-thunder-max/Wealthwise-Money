<blueprint id="javascript_gemini_ai_integrations">
  <display_name>Gemini</display_name>
  <description>
  Blueprint for using multimodal Gemini with JavaScript or TypeScript.
It internally uses Replit AI Integrations, which provides Gemini-compatible API access without requiring your own API key.

AI integrations currently supports the following Gemini APIs:
- generateContent/generate_content
- generateContentStream/generate_content_stream

AI integrations currently supports the following Gemini models:
- gemini-3.1-pro-preview: latest and most powerful model for agentic workflows and vibe-coding. Prefer this one over other pro series models.
- gemini-3-pro-preview: powerful model for agentic workflows and vibe-coding.
- gemini-3-flash-preview: hybrid reasoning model good for daily use and high-volume tasks. Prefer this one over flash series models.
- gemini-3-pro-image-preview (nano banana pro): thinking model that is good for high-quality image generation tasks where detail and accuracy matters most.
- gemini-2.5-pro: excels at coding and complex reasoning tasks
- gemini-2.5-flash: hybrid reasoning model good for daily use and high-volume tasks
- gemini-2.5-flash-image (nano banana): native image generation model good for ultra-fast image generation tasks where speed matters most.

IMPORTANT: Models not listed above are NOT available through AI integrations. Never use unlisted models with this integration.
The following capabilities are NOT supported by Gemini AI integrations. DO NOT use this blueprint for these use cases:
- Live API (for any model)
- embeddings
- fine-tuning
- files API
- audio/video generation/output

Some example use cases (non-exhaustive):
- gemini-3.1-pro-preview: tasks requiring complex reasoning
- gemini-2.5-flash: general purpose chat, image/audio/video transcription/summary/analysis, high-volume tasks
- gemini-2.5-flash-image: image generation

Example use cases for when NOT to use this integration are below. For these use cases, consider searching for other integrations first, then using api-key based Gemini if none are found:
- realtime voice/video interaction
- audio or video generation

When user is building features related to "Agent Stack (Agents and Automations)", you MUST always setup an LLM provider - regardless of whether the specific implementation appears to need AI/LLM capabilities or not. DO NOT second-guess this requirement. Skipping the LLM provider setup in such cases will lead to broken code and awful user experience. Follow the guidelines below to determine whether to match this blueprint or other Gemini integrations.

<selection_guidelines>
BEFORE selecting this blueprint, you MUST check if the user already has the integration they need set up. If they do then DO NOT select this blueprint.

Then match whether or not to use this integration based on the following order of precedence (stop at the first match):

1) Explicit user requests
- The user wants to use their own API key: Do NOT use this blueprint.
- The user specifically asks for Gemini and the requested capability is supported by Gemini AI integrations: Use this blueprint. 
- The user asked for Gemini but the requested capability is not supported by Gemini AI integrations, fallback to the api-key-based Gemini blueprint.

2) Use-case triggers (choose this blueprint)
- Image editing/generation (prefer Gemini image generation over OpenAI).
- Audio/video input or other scenarios only supported by this integration.

3) No provider specified
- Default to OpenAI AI integrations if it supports the requested use case. If it does not support the use case, fallback to OpenAI api-key based integration.
- If even the OpenAI api-key based integration does not support the requested use case, find another integration or alternative.

If this is the first time proposing or using this blueprint, clearly indicate that this internally uses Replit AI Integrations for Gemini access, does not require your own API key, and that charges are billed to your credits. You must specifically include every one of these three details.
</selection_guidelines>
  </description>
  <instructions>
  <important>
  You should NEVER ask the user for secrets or env vars for this blueprint. Nor should you ever attempt to modify these env vars. AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY are automatically set when the blueprint is setup.

  The value of AI_INTEGRATIONS_GEMINI_API_KEY is meant to be a dummy string value only to make the code compatible with the SDK. Do not assume it's misconfigured by simply checking the value without testing the API call directly. It should work as expected when AI_INTEGRATIONS_GEMINI_BASE_URL is also set.

  If you believe integration setup failed or the env vars are still missing after setup, retry installation using the use_integration "add" tool. DO NOT try measures other than this to fix the issue. If after more than 3 retries, the issue persists, switch to using the api-key-based blueprint instead.
</important>

<code_generation_guidelines>
  Use the SDK client shown in the provided modules rather than calling endpoints directly via fetch.

  When instantiating the Gemini client, refer to the provided code to see how to initialize the client with AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY environment variables.

  When building features on Agent Stack (Agents and Automations), use AI_INTEGRATIONS_GEMINI_BASE_URL and AI_INTEGRATIONS_GEMINI_API_KEY when instantiating the Gemini client.

  For any tasks that require making multiple/many LLM calls, you MUST use retries with backoff and rate limiters when making LLM calls. Use the batch utilities module for guidance.

  To avoid unexpected overcharges, only use the pro-series image model when the user explicitly:
- requests to use a pro-series image model
- requests to use nano banana pro
- asks for high-quality image generation
By default, prefer to use the latest flash-series image model.

  If your app processes audio or video inputs, you MUST chunk your input data into smaller chunks and process individually. Gemini through AI integrations only supports inline input data (no files API support), which has a max input size limit of 8 MB. In addition to chunking you MUST ALWAYS use retries AND rate limiting when making LLM calls for audio/video processing.

  If you set a max tokens limit, use 8192 tokens. NEVER set any token limits lower than this unless explicitly requested.
</code_generation_guidelines>

<integration>
  Server-side files have been added to your project. Check the tool call results above to see the file paths. Import and use/edit these files rather than ignoring them.

  <provided_modules>
    Chat module (replit_integrations/chat/):
    - routes.ts - API endpoints with streaming support
    - storage.ts - Database operations for conversations and messages
    - index.ts - Re-exports registerChatRoutes and chatStorage

    Image module (replit_integrations/image/):
    - routes.ts - Image generation endpoint
    - client.ts - Gemini client setup with configured env vars
    - index.ts - Re-exports registerImageRoutes

    Batch utilities (replit_integrations/batch/):
    - batchProcess<T, R>(items, processor, options) - Generic batch processor with rate limiting and retries
    - batchProcessWithSSE<T, R>(items, processor, sendEvent, options) - Sequential processor with SSE streaming
    - isRateLimitError(error) - Helper to detect rate limit errors

    Schema (shared/models/chat.ts):
    - Drizzle schema for conversations and messages tables
    - Zod validation schemas via drizzle-zod
    - TypeScript types for Conversation, Message, and insert types
  </provided_modules>
  
  <wiring_instructions>
    Wire up the integration:
    
    1. Register routes in your server file:
       ```typescript
       // For text-based apps:
       import { registerChatRoutes } from "./replit_integrations/chat";
       registerChatRoutes(app);
       import { registerImageRoutes } from "./replit_integrations/image";
       registerImageRoutes(app);
       ```
    
    2. Export the schema from shared/schema.ts:
       ```typescript
       export * from "./models/chat";
       ```
    
    3. Run database migration:
       ```bash
       npm run db:push
       ```
    
    4. Write client-side UI components based on user requirements.
    
    5. For batch processing tasks, ALWAYS use the batchProcess utility:
       ```typescript
       import { batchProcess } from "./replit_integrations/batch";
       import OpenAI from "openai";
       
       const openai = new OpenAI({
         apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
         baseURL: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
       });
       
       // Process any items with your custom LLM logic
       const results = await batchProcess(
         items, // Your input array (CSV rows, artworks, etc.)
         async (item) => {
           // Write your custom LLM call here
           const response = await openai.chat.completions.create({
             model: "gpt-5.1",
             messages: [{ role: "user", content: `Process: ${item.name}` }],
             response_format: { type: "json_object" },
           });
           return JSON.parse(response.choices[0]?.message?.content || "{}");
         },
         { concurrency: 2, retries: 5 }
       );
       ```
       
       For SSE streaming progress:
       ```typescript
       import { batchProcessWithSSE } from "./replit_integrations/batch";
       
       // In your SSE endpoint
       await batchProcessWithSSE(
         items,
         async (item) => { /* your processor */ },
         (event) => res.write(`data: ${JSON.stringify(event)}\n\n`)
       );
       ```
  </wiring_instructions>
  
  <drizzle_dependency>
    The schema uses Drizzle ORM with drizzle-zod for validation.
    - If project has Drizzle: schema works as-is
    - If project uses different ORM: rewrite shared/models/chat.ts to match,
      keeping the same table structure (conversations, messages)
  </drizzle_dependency>

  <important>
    - DO NOT modify the Gemini client setup - env vars are auto-configured
    - DO NOT rewrite the integration files unless adapting to a different ORM
  </important>
</integration>
  </instructions>
</blueprint>