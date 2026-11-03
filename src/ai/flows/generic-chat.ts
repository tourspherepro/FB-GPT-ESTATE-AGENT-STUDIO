
'use server';

/**
 * @fileOverview A generic chat flow for direct interaction with the AI.
 *
 * - genericChat - A function that takes a history of messages and returns a new AI response.
 * - ChatMessage - The type for a single message in the chat history.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {type MessageData} from 'genkit/model';

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const GenericChatInputSchema = z.array(ChatMessageSchema);
export type GenericChatInput = z.infer<typeof GenericChatInputSchema>;

const GenericChatOutputSchema = ChatMessageSchema;
export type GenericChatOutput = z.infer<typeof GenericChatOutputSchema>;


export async function genericChat(
  input: GenericChatInput
): Promise<GenericChatOutput> {
  return genericChatFlow(input);
}


const genericChatFlow = ai.defineFlow(
  {
    name: 'genericChatFlow',
    inputSchema: GenericChatInputSchema,
    outputSchema: GenericChatOutputSchema,
  },
  async (messages) => {
    // Construct the history for the prompt
    const history: MessageData[] = messages.map(m => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    try {
        const response = await ai.generate({
          prompt: history,
          model: 'googleai/gemini-2.5-flash',
        });
        
        const text = response.text;
        const finishReason = response.finishReason;

        if (finishReason !== 'STOP' || !text) {
             return {
                role: 'model',
                content: "I'm sorry, I couldn't generate a response. The response may have been blocked due to safety settings. Please try again with a different prompt.",
            };
        }
        
        return {
            role: 'model',
            content: text,
        };
    } catch (error) {
        console.error('Error in genericChatFlow:', error);
        return {
            role: 'model',
            content: "I'm sorry, an error occurred while trying to generate a response. The AI service may be temporarily unavailable.",
        };
    }
  }
);

