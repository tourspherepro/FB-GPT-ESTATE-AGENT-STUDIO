
'use server';
/**
 * @fileOverview An AI agent for generating room descriptions from property photos.
 *
 * - describeRoomsFromPhotos - A function that takes photos and room names and returns descriptions.
 * - DescribeRoomsInput - The input type for the function.
 * - DescribeRoomsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Part } from 'genkit/model';

const DescribeRoomsInputSchema = z.object({
  photoDataUris: z
    .array(
      z
        .string()
        .describe(
          "A photo of a property, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .describe('An array of property photos.'),
  roomNames: z.array(z.string()).describe('A list of room names to generate descriptions for.'),
});
export type DescribeRoomsInput = z.infer<typeof DescribeRoomsInputSchema>;

const RoomDescriptionSchema = z.object({
  roomName: z.string().describe('The name of the room.'),
  description: z.string().describe('The AI-generated description of the room.'),
});

const DescribeRoomsOutputSchema = z.object({
  descriptions: z.array(RoomDescriptionSchema).describe('An array of room names and their generated descriptions.'),
});
export type DescribeRoomsOutput = z.infer<typeof DescribeRoomsOutputSchema>;

export async function describeRoomsFromPhotos(
  input: DescribeRoomsInput
): Promise<DescribeRoomsOutput> {
  return describeRoomsFlow(input);
}

const describeRoomsFlow = ai.defineFlow(
  {
    name: 'describeRoomsFlow',
    inputSchema: DescribeRoomsInputSchema,
    outputSchema: DescribeRoomsOutputSchema,
  },
  async (input) => {
    if (input.photoDataUris.length === 0 || input.roomNames.length === 0) {
      return { descriptions: [] };
    }

    const promptText = `You are an expert real estate copywriter. Your task is to write a single, compelling descriptive sentence for each room in the provided list, based on the images.

Generate a description for each of these rooms:
${input.roomNames.map(name => `- ${name}`).join('\n')}

For each room, look for key features in the photos that would appeal to a buyer. For example, mention large windows, a fireplace, modern fittings, or flooring type.

If you cannot see a specific room in the photos, provide a generic but appealing description for that room type.

Your output must be a JSON object containing a 'descriptions' array, where each object has a 'roomName' and a 'description'.`;

    const promptParts: Part[] = [{ text: promptText }];
    input.photoDataUris.forEach(uri => {
        promptParts.push({ media: { url: uri } });
    });

    const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: promptParts,
        output: {
            schema: DescribeRoomsOutputSchema,
        },
    });
    
    if (response.output?.descriptions) {
        return response.output;
    }

    let errorMessage = "The AI failed to generate room descriptions.";
    if (response.finishReason !== 'stop') {
      errorMessage += ` Reason: ${response.finishReason}`;
    } else {
        errorMessage += " This may be due to the images provided, safety filters, or an internal error.";
    }
    throw new Error(errorMessage);
  }
);
