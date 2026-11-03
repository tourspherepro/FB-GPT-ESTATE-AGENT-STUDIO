'use server';
/**
 * @fileOverview Generates a marketing-ready floor plan from a hand-drawn floor plan image.
 *
 * - generateFloorPlanFromDrawing - A function that generates a professional floor plan from a drawing.
 * - GenerateFloorPlanFromDrawingInput - The input type for the generateFloorPlanFromDrawing function.
 * - GenerateFloorPlanFromDrawingOutput - The return type for the generateFloorPlanFromDrawing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFloorPlanFromDrawingInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      "A hand-drawn floor plan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  stylePreferences: z
    .string()
    .optional()
    .describe("Optional style preferences for the generated floor plan, e.g., 'modern', 'minimalist', '3D', etc."),
});
export type GenerateFloorPlanFromDrawingInput = z.infer<typeof GenerateFloorPlanFromDrawingInputSchema>;

const GenerateFloorPlanFromDrawingOutputSchema = z.object({
  floorPlanDataUri: z
    .string()
    .describe('The generated floor plan, as a data URI.'),
});
export type GenerateFloorPlanFromDrawingOutput = z.infer<typeof GenerateFloorPlanFromDrawingOutputSchema>;

export async function generateFloorPlanFromDrawing(input: GenerateFloorPlanFromDrawingInput): Promise<GenerateFloorPlanFromDrawingOutput> {
  return generateFloorPlanFromDrawingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFloorPlanFromDrawingPrompt',
  input: {schema: GenerateFloorPlanFromDrawingInputSchema},
  output: {schema: GenerateFloorPlanFromDrawingOutputSchema},
  prompt: `You are an expert in architectural design and floor plan creation.  You will take a hand-drawn floorplan and generate a professional marketing ready floorplan.

  Instructions:
  1.  Analyze the provided hand-drawn floor plan image.
  2.  Identify key architectural elements such as walls, doors, windows, stairs, and rooms.
  3.  Based on the hand-drawn plan, generate a clear, professional, and visually appealing floor plan.
  4.  Pay attention to detail and ensure accuracy in the generated floor plan.
  5.  The final floor plan should be suitable for marketing purposes.

  Style Preferences (if provided): {{{stylePreferences}}}

  Here is the hand-drawn floor plan:
  {{media url=drawingDataUri}}
  `,
});

const generateFloorPlanFromDrawingFlow = ai.defineFlow(
  {
    name: 'generateFloorPlanFromDrawingFlow',
    inputSchema: GenerateFloorPlanFromDrawingInputSchema,
    outputSchema: GenerateFloorPlanFromDrawingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
