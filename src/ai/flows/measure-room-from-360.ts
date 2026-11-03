
'use server';

/**
 * @fileOverview An AI agent for estimating room dimensions from a 360-degree image.
 * 
 * - measureRoomFrom360 - A function that takes a 360 image and returns estimated dimensions.
 * - MeasureRoomFrom360Output - The return type for the measureRoomFrom360 function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


const MeasureRoomFrom360InputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A 360-degree equirectangular image of a room, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  cameraHeightCm: z
    .number()
    .describe('The height of the camera from the floor in centimeters.'),
});
type MeasureRoomFrom360Input = z.infer<typeof MeasureRoomFrom360InputSchema>;


export type MeasureRoomFrom360Output = z.infer<typeof MeasureRoomFrom360OutputSchema>;
const MeasureRoomFrom360OutputSchema = z.object({
  lengthMeters: z.number().describe('The estimated length of the room in meters.'),
  widthMeters: z.number().describe('The estimated width of the room in meters.'),
  heightMeters: z.number().describe('The estimated height of the room in meters.'),
});


const measurePrompt = ai.definePrompt({
  name: 'measureRoomFrom360Prompt',
  input: { schema: MeasureRoomFrom360InputSchema },
  output: { schema: MeasureRoomFrom360OutputSchema },
  prompt: `You are an expert in photogrammetry and spatial analysis. Your task is to analyze the provided 360-degree equirectangular image of a room and estimate its dimensions.

  CRITICAL INFORMATION: The camera was positioned at a height of {{{cameraHeightCm}}} cm from the floor. This is your primary reference for determining the scale of the room.

  Instructions:
  1.  Analyze the geometry, perspective lines, and features within the image (e.g., doors, windows, furniture).
  2.  Use the known camera height of {{{cameraHeightCm}}} cm as the ground truth for your scale calculations.
  3.  Estimate the overall length, width, and height of the room.
  4.  Provide your answer in meters.
  5.  Your output must be only the structured JSON object with the fields 'lengthMeters', 'widthMeters', and 'heightMeters'.

  360 Image: {{media url=imageDataUri}}`,
});

const measureRoomFlow = ai.defineFlow(
  {
    name: 'measureRoomFrom360Flow',
    inputSchema: MeasureRoomFrom360InputSchema,
    outputSchema: MeasureRoomFrom360OutputSchema,
  },
  async (input) => {
    const { output } = await measurePrompt(input);
    if (!output) {
        throw new Error('The AI model failed to return valid measurements.');
    }
    return output;
  }
);


// The only exported function that is async
export async function measureRoomFrom360(input: MeasureRoomFrom360Input): Promise<MeasureRoomFrom360Output> {
  return measureRoomFlow(input);
}
