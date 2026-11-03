
'use server';
/**
 * @fileOverview The engine for the Creator Studio tool.
 * This flow takes a user's creative request and translates it into a structured
 * JSON object that the EASTUDIO orchestrator can use to call various AI models.
 */

import { ai, googleAI } from '@/ai/genkit';
import { z } from 'genkit';

// Schemas based on the EASTUDIO JSON Contract

const ApiPayloadSchema = z.object({
  version: z.string().optional(), // For Replicate
  inputs: z.string().optional(), // For HuggingFace
  input: z.object({ // For Replicate
    prompt: z.string(),
    num_frames: z.number().optional(),
    fps: z.number().optional(),
  }).optional(),
});

const SaveSchema = z.object({
  storagePath: z.string().describe("Path format: creator/{uid}/{projectId}/assets/{assetId}"),
  firestoreCollection: z.string().describe("Path format: creatorProjects/{projectId}/assets"),
  metadata: z.object({
    prompt: z.string(),
    model: z.string(),
    provider: z.string(),
    type: z.enum(['image', 'video']),
    timestamp: z.string(),
  }),
});

const UiSchema = z.object({
  title: z.string(),
  description: z.string(),
  thumbnail: z.string().url(),
});

const CreatorStudioOutputSchema = z.object({
  action: z.literal('generate'),
  type: z.enum(['image', 'video']),
  finalPrompt: z.string(),
  model: z.enum(['sd15', 'sdxl', 'playground-v2', 'videocrafter2', 'modelscope', 'zeroscope', 'animatediff']),
  provider: z.enum(['huggingface', 'replicate']),
  apiPayload: ApiPayloadSchema,
  save: SaveSchema,
  ui: UiSchema,
});
export type CreatorStudioOutput = z.infer<typeof CreatorStudioOutputSchema>;

// Define Input Schema
const CreatorStudioInputSchema = z.object({
    requestType: z.enum(['text_to_image', 'text_to_video', 'image_to_video']),
    prompt: z.string(),
    durationSeconds: z.number().optional(),
    imageDataUri: z.string().optional().describe("A data URI for the input image if doing image-to-video"),
});
export type CreatorStudioInput = z.infer<typeof CreatorStudioInputSchema>;


// 1. Prompt Rewriter Flow (Internal)
const rewritePrompt = ai.defineFlow(
  {
    name: 'rewriteCreativePrompt',
    inputSchema: z.object({
      prompt: z.string(),
      signal: z.any().optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ prompt, signal }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `You are a creative director. Enhance the following prompt for an AI image or video generator. Expand on scene description, camera angles, lighting, mood, and movement. Output only the final, generation-ready prompt.
      
      Original prompt: "${prompt}"`,
    });
    return llmResponse.text;
  }
);

// 3. Main Creator Studio Flow
const creatorStudioFlow = ai.defineFlow(
  {
    name: 'creatorStudioFlow',
    inputSchema: CreatorStudioInputSchema.extend({
        signal: z.any().optional(),
    }),
    outputSchema: CreatorStudioOutputSchema,
  },
  async (input) => {
    // Step 1: Rewrite the prompt
    const finalPrompt = await rewritePrompt({prompt: input.prompt, signal: input.signal });

    let model: CreatorStudioOutput['model'] = 'sdxl';
    let provider: CreatorStudioOutput['provider'] = 'huggingface';
    let apiPayload: z.infer<typeof ApiPayloadSchema> = {};

    // Step 2: Determine model, provider, and payload based on request type
    switch (input.requestType) {
        case 'text_to_image':
            model = 'sdxl';
            provider = 'huggingface';
            apiPayload = {
              inputs: finalPrompt,
            };
            break;
        case 'text_to_video':
            model = 'videocrafter2';
            provider = 'replicate';
            apiPayload = {
              version: 'a08a984365287040a164b330e2f5b99a6064f215098a5840d216f9a0328905a5',
              input: {
                prompt: finalPrompt,
                num_frames: (input.durationSeconds || 3) * 8, // Assuming 8fps
                fps: 8,
              }
            };
            break;
        case 'image_to_video':
            model = 'modelscope';
            provider = 'replicate';
            apiPayload = {
              version: 'd804baa863450c3884e9334c9c1b72e9c15d7e5d8363712b5b8883582522e892',
              input: {
                  prompt: finalPrompt, // ModelScope can use a prompt to guide animation
                  // It would also need the image URI, which the orchestrator would add
              }
            };
            break;
    }

    // Step 4: Create mock asset IDs and paths
    const uid = 'user123'; // Mock UID
    const projectId = 'project789'; // Mock Project ID
    const assetId = `${model}-${Date.now()}`;
    
    // Step 5: Assemble the final JSON output
    const output: CreatorStudioOutput = {
      action: 'generate',
      type: input.requestType.includes('image') ? 'image' : 'video',
      model: model,
      provider: provider,
      finalPrompt: finalPrompt,
      apiPayload: apiPayload,
      save: {
        storagePath: `creator/${uid}/${projectId}/assets/${assetId}`,
        firestoreCollection: `creatorProjects/${projectId}/assets`,
        metadata: {
            prompt: finalPrompt,
            model: model,
            provider: provider,
            type: input.requestType.includes('image') ? 'image' : 'video',
            timestamp: new Date().toISOString(),
        },
      },
      ui: {
        title: `Asset: ${input.prompt.substring(0, 20)}...`,
        description: `Generated via ${model} (${provider}) with prompt: "${finalPrompt}"`,
        thumbnail: 'https://picsum.photos/seed/thumb/200/200', // Placeholder thumbnail
      },
    };

    return output;
  }
);

// Exported Server Action for the UI to call
export async function runCreatorStudio(input: CreatorStudioInput, signal?: AbortSignal): Promise<CreatorStudioOutput> {
    return creatorStudioFlow({...input, signal});
}
