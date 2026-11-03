
'use server';
/**
 * @fileOverview A flow for generating a social media post from a text prompt.
 *
 * - generateSocialPost - A function that takes a prompt and returns a generated social media post.
 * - GenerateSocialPostInput - The input type for the generateSocialPost function.
 * - GenerateSocialPostOutput - The return type for the generateSocialPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialPostInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate the social media post from.'),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

const GenerateSocialPostOutputSchema = z.object({
  post: z.string().describe('The generated social media post.'),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;

export async function generateSocialPost(
  input: GenerateSocialPostInput
): Promise<GenerateSocialPostOutput> {
  return generateSocialPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialPostPrompt',
  input: {schema: GenerateSocialPostInputSchema},
  output: {schema: GenerateSocialPostOutputSchema},
  prompt: `You are an expert social media manager for a real estate agency. 
  
  Your task is to create an engaging social media post based on the following idea. The post should be concise, professional, and include relevant emojis and hashtags.

  Idea: {{{prompt}}}
  `,
});

const generateSocialPostFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFlow',
    inputSchema: GenerateSocialPostInputSchema,
    outputSchema: GenerateSocialPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      post: output!.post,
    };
  }
);
