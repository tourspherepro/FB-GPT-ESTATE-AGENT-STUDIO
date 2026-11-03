'use server';
/**
 * @fileOverview A flow for generating a social media video from a text prompt.
 *
 * - generateSocialVideo - A function that takes a prompt and video parameters to generate a video.
 * - GenerateSocialVideoInput - The input type for the generateSocialVideo function.
 * - GenerateSocialVideoOutput - The return type for the generateSocialVideo function.
 */

import {ai} from '@/ai/genkit';
import {z, type MediaPart} from 'genkit';

const GenerateSocialVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the video from.'),
  aspectRatio: z
    .string()
    .describe('The aspect ratio of the video, e.g., "16:9", "9:16", "1:1".'),
  durationSeconds: z.number().describe('The duration of the video in seconds.'),
});
export type GenerateSocialVideoInput = z.infer<
  typeof GenerateSocialVideoInputSchema
>;

const GenerateSocialVideoOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'The generated video, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type GenerateSocialVideoOutput = z.infer<
  typeof GenerateSocialVideoOutputSchema
>;

export async function generateSocialVideo(
  input: GenerateSocialVideoInput
): Promise<GenerateSocialVideoOutput> {
  return generateSocialVideoFlow(input);
}

const generateSocialVideoFlow = ai.defineFlow(
  {
    name: 'generateSocialVideoFlow',
    inputSchema: GenerateSocialVideoInputSchema,
    outputSchema: GenerateSocialVideoOutputSchema,
  },
  async input => {
    let {operation} = await ai.generate({
      model: 'googleai/veo-3.0-generate-preview',
      prompt: input.prompt,
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. This may take up to a minute.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const videoPart = operation.output?.message?.content.find(p => !!p.media);
    if (!videoPart || !videoPart.media) {
      throw new Error('Failed to find the generated video in the response');
    }

    const videoBuffer = await downloadVideo(videoPart.media);

    return {
      videoDataUri: `data:video/mp4;base64,${videoBuffer.toString('base64')}`,
    };
  }
);

// Helper function to download video content from the signed URL provided by Veo.
async function downloadVideo(video: MediaPart['media']): Promise<Buffer> {
  const fetch = (await import('node-fetch')).default;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Please add it to your .env file.'
    );
  }
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    const errorBody = await videoDownloadResponse.text();
    console.error('Failed to download video:', errorBody);
    throw new Error(`Failed to fetch video. Status: ${videoDownloadResponse.status}`);
  }

  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    (videoDownloadResponse.body as any).on('data', (chunk: Buffer) => chunks.push(chunk));
    (videoDownloadResponse.body as any).on('error', reject);
    (videoDownloadResponse.body as any).on('end', () => resolve(Buffer.concat(chunks)));
  });
}
