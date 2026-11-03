
'use server';

/**
 * @fileOverview An AI agent for analyzing floor plan images to extract measurement data.
 *
 * - analyzeFloorPlan - A function that takes a floor plan image and returns structured measurement data.
 * - AnalyzeFloorPlanInput - The input type for the analyzeFloorPlan function.
 * - AnalyzeFloorPlanOutput - The return type for the analyzeFloorPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const AnalyzeFloorPlanInputSchema = z.object({
  floorplanDataUri: z
    .string()
    .describe(
      "A floor plan image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFloorPlanInput = z.infer<typeof AnalyzeFloorPlanInputSchema>;

const MeasurementDataSchema = z.object({
  floorName: z.string().describe('The name of the floor level, e.g., "Ground Floor".'),
  rooms: z.array(
    z.object({
      roomName: z.string().describe('The name of the room, e.g., "Living Room".'),
      dimensions: z.string().describe('The dimensions of the room in meters, e.g., "3.04m x 2.76m".').optional(),
    })
  ).describe('A list of rooms on this floor.'),
});
export type MeasurementData = z.infer<typeof MeasurementDataSchema>;

const AnalyzeFloorPlanOutputSchema = z.object({
    measurements: z.array(MeasurementDataSchema).optional().describe('An array of floor measurement data.'),
});
export type AnalyzeFloorPlanOutput = z.infer<typeof AnalyzeFloorPlanOutputSchema>;


export async function analyzeFloorPlan(
  input: AnalyzeFloorPlanInput
): Promise<AnalyzeFloorPlanOutput> {
  return analyzeFloorPlanFlow(input);
}

const floorplanPrompt = ai.definePrompt({
  name: 'floorplanAnalysisPrompt',
  input: { schema: AnalyzeFloorPlanInputSchema },
  output: { schema: AnalyzeFloorPlanOutputSchema },
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an expert architect. Analyze the provided floor plan image.
  
  Your task is to identify all floor levels (e.g., Ground Floor, First Floor), and the names of all rooms on each level.
  
  For each room, you MUST also extract its measurements in meters.
  
  If you can identify a room but cannot determine its measurements, you should still include the room in the list but omit the 'dimensions' field.
  
  Structure the output by floor, then by room. Ensure any dimensions you find are in the format "X.XXm x Y.YYm".

  Floor Plan: {{media url=floorplanDataUri}}`,
});


const analyzeFloorPlanFlow = ai.defineFlow(
  {
    name: 'analyzeFloorPlanFlow',
    inputSchema: AnalyzeFloorPlanInputSchema,
    outputSchema: AnalyzeFloorPlanOutputSchema,
  },
  async input => {
    const response = await floorplanPrompt(input);
    
    if (response.output?.measurements) {
      return response.output;
    }

    let errorMessage = "The AI failed to analyze the floor plan.";
    if (response.finishReason !== 'STOP' && response.candidates?.[0]?.finishMessage) {
        errorMessage += ` Reason: ${response.candidates[0].finishMessage}`;
    } else {
        errorMessage += " This may be due to an unclear image, safety filters, or an internal error.";
    }
    throw new Error(errorMessage);
  }
);
