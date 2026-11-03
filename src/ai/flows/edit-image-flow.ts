
'use server';
/**
 * @fileOverview An AI agent for editing property images based on a text prompt.
 *
 * - editImage - A function that takes an image and a prompt and returns an edited image.
 * - EditImageInput - The input type for the editImage function.
 * - EditImageOutput - The return type for the editImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EditImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The property image to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .describe('A description of the edits to make to the image. For example: "auto-enhance" to apply professional real estate photo corrections, "Replace the gray sky with a clear blue sky", "Remove the car from the driveway", "Add modern furniture to the living room".'),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

const EditImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe('The edited image, as a data URI.'),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: EditImageOutputSchema,
  },
  async ({ imageDataUri, prompt }) => {

    let finalPrompt = prompt;
    if (prompt === 'auto-enhance') {
      finalPrompt = 'Enhance this real estate photo to look clean, professional, and appealing. Improve brightness and contrast, make colours more vibrant, and sharpen details. Do not add, remove, or change any objects in the scene. The final image should look like a high-quality professional photograph suitable for a property listing.';
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { media: { url: imageDataUri } },
        { text: finalPrompt },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed or did not return an image.');
    }

    return { imageDataUri: media.url };
  }
);
