
'use server';
/**
 * @fileOverview An AI agent for updating property records in Alto Vebra.
 *
 * - runAltoUpdate - A function that takes property information and returns a sequence of automation steps.
 * - AltoUpdateInput - The input type for the runAltoUpdate function.
 * - AltoUpdateOutput - The return type for the runAltoUpdate function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// --- Input Schema ---
const PropertyDetailsSchema = z.object({
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  receptionRooms: z.number().optional(),
  propertyType: z.string().optional(),
});

const AltoUpdateInputSchema = z.object({
  propertyAddress: z.string().describe("The full address of the property to be updated in Alto."),
  propertyDetails: PropertyDetailsSchema.optional().describe("Structured details about the property."),
  propertyDescription: z.string().optional().describe("The full marketing description of the property."),
  propertyHighlights: z.array(z.string()).optional().describe("A list of key highlight features for the property."),
});
export type AltoUpdateInput = z.infer<typeof AltoUpdateInputSchema>;


// --- Output Schema ---
const AgentStepSchema = z.object({
  action: z.enum(['NAVIGATE', 'TYPE', 'CLICK', 'SELECT', 'WAIT_FOR', 'SCRAPE']).describe("The type of action the automation agent should perform."),
  target: z.string().describe("The UI element to interact with, described by its label, placeholder, or a unique selector."),
  value: z.string().optional().describe("The value to type or select. For navigation, this is the URL."),
  description: z.string().describe("A human-readable description of what the agent is doing in this step."),
});

const AltoUpdateOutputSchema = z.object({
  steps: z.array(AgentStepSchema).describe("A sequence of steps for the robotic process automation (RPA) agent to follow."),
});
export type AltoUpdateOutput = z.infer<typeof AltoUpdateOutputSchema>;


// --- Main Exported Function ---
export async function runAltoUpdate(input: AltoUpdateInput): Promise<AltoUpdateOutput> {
  return altoUpdateFlow(input);
}


// --- Genkit Prompt Definition ---
const altoAgentPrompt = ai.definePrompt({
  name: 'altoAgentPrompt',
  input: { schema: AltoUpdateInputSchema },
  output: { schema: AltoUpdateOutputSchema },
  system: `You are an expert AI agent controlling a browser to automate tasks in the 'Alto Vebra' real estate software.
Your job is to take property information and generate a precise sequence of actions (a 'plan') for a robot to follow.

RULES:
1.  You MUST start by navigating to the Alto login page and logging in.
2.  After logging in, you MUST navigate to the main properties search page.
3.  You MUST search for the property using its address.
4.  Once on the property record, you MUST navigate to the 'Marketing' tab.
5.  Update the 'Property Highlights' and 'Full Description' fields with the provided text.
6.  The robot can only perform these actions: NAVIGATE, TYPE, CLICK, SELECT, WAIT_FOR, SCRAPE.
7.  The 'target' for actions should be described simply, using UI labels (e.g., "Username input", "Search button", "Marketing tab").
8.  Do NOT invent steps. Only use the information provided.
`,
  prompt: `
Generate the automation steps to update the property in Alto Vebra.

Property Address: {{propertyAddress}}

Property Details:
{{#if propertyDetails}}
- Type: {{propertyDetails.propertyType}}
- Bedrooms: {{propertyDetails.bedrooms}}
- Receptions: {{propertyDetails.receptionRooms}}
- Bathrooms: {{propertyDetails.bathrooms}}
{{/if}}

Property Highlights to set:
{{#if propertyHighlights}}
{{#each propertyHighlights}}
- {{{this}}}
{{/each}}
{{/if}}

Full Description to set:
"{{{propertyDescription}}}"
`,
});


// --- Genkit Flow Definition ---
const altoUpdateFlow = ai.defineFlow(
  {
    name: 'altoUpdateFlow',
    inputSchema: AltoUpdateInputSchema,
    outputSchema: AltoUpdateOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        prompt: altoAgentPrompt,
        model: googleAI.model('gemini-2.5-flash'),
        input,
    });
    
    if (!output) {
      throw new Error("The AI agent failed to generate an update plan for Alto.");
    }
    
    return output;
  }
);
