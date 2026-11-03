
'use server';

/**
 * @fileOverview An AI agent for generating a professional property brochure from various data sources.
 *
 * - generateBrochure - A function that takes comprehensive property data and returns a Markdown-formatted brochure.
 * - GenerateBrochureInput - The input type for the generateBrochure function.
 * - GenerateBrochureOutput - The return type for the generateBrochure function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateBrochureInputSchema = z.object({
  propertyAddress: z.string().describe("The full address of the property."),
  photoDataUris: z
    .array(z.string())
    .describe('An array of property photos as data URIs.'),
  propertyType: z.string().optional().describe("e.g., 'Detached House'"),
  bedrooms: z.string().optional(),
  receptionRooms: z.string().optional(),
  bathrooms: z.string().optional(),
  adHighlights: z.string().describe("Bulleted list of key features, separated by newlines."),
  adDescription: z.string().describe("The main marketing description of the property."),
  measurements: z.array(z.any()).optional().describe("Structured data of floor plans and room dimensions."),
  localSummary: z.any().optional().describe("Structured data about local amenities, schools, transport, etc."),
  epcData: z.any().optional().describe("Data from the Energy Performance Certificate, including rating and costs."),
});
export type GenerateBrochureInput = z.infer<typeof GenerateBrochureInputSchema>;


const GenerateBrochureOutputSchema = z.object({
  brochureMarkdown: z.string().describe('A complete, well-structured property brochure in Markdown format.'),
});
export type GenerateBrochureOutput = z.infer<typeof GenerateBrochureOutputSchema>;


export async function generateBrochure(
  input: GenerateBrochureInput
): Promise<GenerateBrochureOutput> {
  return generateBrochureFlow(input);
}


const brochurePrompt = ai.definePrompt({
  name: 'generateBrochurePrompt',
  input: { 
    schema: GenerateBrochureInputSchema.omit({
      measurements: true,
      localSummary: true,
      epcData: true,
    }).extend({
      measurementsString: z.string().optional(),
      localSummaryString: z.string().optional(),
      epcDataString: z.string().optional(),
    })
  },
  output: { schema: GenerateBrochureOutputSchema },
  prompt: `You are an expert estate agent copywriter and designer. Your task is to create a comprehensive, elegant, and professional property brochure using the provided data. The output must be in Markdown format, ready for display.

  **Style Guide:**
  - **Tone:** Professional, inviting, and informative. Use UK English.
  - **Structure:** Use Markdown headers (#, ##, ###), lists (*), bold (**text**), and italics (*text*) to create a clear and visually appealing hierarchy.
  - **Images:** You will be given data URIs for photos. Represent the main photo at the top. You don't need to display all photos, but refer to them in your descriptions.
  - **Data Integration:** Seamlessly weave all provided data into the brochure. If a piece of data is missing (e.g., EPC), omit that section gracefully.

  **Brochure Structure:**
  1.  **Main Header:** Use the property address as the main title (#).
  2.  **Hero Image:** Represent the first photo provided as the main hero image of the brochure. Use Markdown image syntax: ![Main Property Image](FIRST_PHOTO_URI)
  3.  **Introduction:** Write a compelling opening paragraph based on the main property description.
  4.  **Key Features:** Present the 'adHighlights' as a clean, bulleted list.
  5.  **Property Walkthrough:**
      - Create a section for "A Closer Look" or "Property Walkthrough".
      - Use the room 'measurements' data. For each floor, create a sub-heading (e.g., ### Ground Floor).
      - For each room, list its name and dimensions. Follow it with a descriptive sentence about that room (you can infer this from the room name and property type if specific descriptions are not provided).
  6.  **Local Area:**
      - Create a section for "Discover the Area" or "Location".
      - Use the 'localSummary' data to write paragraphs about Amenities, Schools, and Transport links.
  7.  **Energy Performance Certificate (EPC):**
      - If 'epcData' is available, create a section for it.
      - Clearly state the current and potential energy efficiency ratings (e.g., "Current: C (72) | Potential: B (85)").
  8.  **Floor Plan:**
      - If a floor plan image is available (often the last photo), display it here under a "Floor Plan" heading.
      - Use Markdown: ![Floor Plan](FLOORPLAN_PHOTO_URI)
  9.  **Contact Information (Footer):** End with a clear call to action, like "To arrange a viewing, please contact [Your Agency Name] on [Your Phone Number]".

  ---
  **PROVIDED DATA:**

  **Address:** {{propertyAddress}}
  **Property Type:** {{propertyType}}
  **Rooms:** {{bedrooms}} Bed, {{receptionRooms}} Reception, {{bathrooms}} Bath

  **Photos:**
  {{#each photoDataUris}}
  - {{media url=this}}
  {{/each}}

  **Highlights:**
  {{{adHighlights}}}

  **Description:**
  "{{{adDescription}}}"

  **Room Measurements:**
  {{#if measurementsString}}
  \`\`\`json
  {{{measurementsString}}}
  \`\`\`
  {{else}}
  Not provided.
  {{/if}}

  **Local Summary:**
  {{#if localSummaryString}}
  \`\`\`json
  {{{localSummaryString}}}
  \`\`\`
  {{else}}
  Not provided.
  {{/if}}

  **EPC Data:**
  {{#if epcDataString}}
  \`\`\`json
  {{{epcDataString}}}
  \`\`\`
  {{else}}
  Not provided.
  {{/if}}
  ---

  Now, generate the complete brochure in Markdown format.
  `,
});


const generateBrochureFlow = ai.defineFlow(
  {
    name: 'generateBrochureFlow',
    inputSchema: GenerateBrochureInputSchema,
    outputSchema: GenerateBrochureOutputSchema,
  },
  async (input) => {
    // Create the input for the prompt, stringifying the complex objects.
    const promptInput = {
      ...input,
      measurementsString: input.measurements ? JSON.stringify(input.measurements, null, 2) : undefined,
      localSummaryString: input.localSummary ? JSON.stringify(input.localSummary, null, 2) : undefined,
      epcDataString: input.epcData ? JSON.stringify(input.epcData, null, 2) : undefined,
    };

    // Remove the original complex objects to avoid schema mismatch.
    delete (promptInput as any).measurements;
    delete (promptInput as any).localSummary;
    delete (promptInput as any).epcData;
    
    const { output } = await brochurePrompt(promptInput);
    
    if (!output) {
      throw new Error('Failed to generate brochure content.');
    }

    return { brochureMarkdown: output.brochureMarkdown };
  }
);
