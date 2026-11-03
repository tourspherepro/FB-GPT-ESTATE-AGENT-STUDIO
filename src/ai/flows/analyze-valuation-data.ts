

'use server';

/**
 * @fileOverview An AI agent for analyzing real estate data, including images and postcodes,
 * to generate property adverts and a local area summary.
 *
 * - analyzeValuationData - A function that takes real estate data as input and returns a property advert and a local summary.
 * - AnalyzeValuationDataInput - The input type for the analyzeValuationData function.
 * - AnalyzeValuationDataOutput - The return type for the analyzeValuationData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { lookupPostcode } from '../tools/postcode-lookup';


const PostcodeDataSchema = z.object({
    parish: z.string().optional().describe('The parish for the postcode.'),
    admin_ward: z.string().optional().describe('The administrative ward for the postcode.'),
    admin_district: z.string().optional().describe('The administrative district for the postcode.'),
    parliamentary_constituency: z.string().optional().describe('The parliamentary constituency for the postcode.'),
    region: z.string().optional().describe('The region for the postcode.'),
});

const postcodeLookup = ai.defineTool(
    {
        name: 'postcodeLookup',
        description: 'Looks up a UK postcode to get accurate location information, including parish, ward, district, constituency, and region.',
        inputSchema: z.object({
            postcode: z.string().describe('The UK postcode to look up.'),
        }),
        outputSchema: PostcodeDataSchema,
    },
    async (input) => {
        return await lookupPostcode(input.postcode);
    }
);


const AnalyzeValuationDataInputSchema = z.object({
  photoDataUris: z
    .array(
      z
        .string()
        .describe(
          "A photo of a property, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        )
    )
    .describe('An array of property photos.'),
  postcode: z.string().optional().describe('The postcode of the property.'),
  propertyType: z.string().optional().describe('The type of property, e.g., "Detached", "Semi-detached".'),
  purchaseStyles: z.array(z.string()).optional().describe('An array of purchase styles, e.g., "Family Home", "First Time Buyer", "Investment".'),
  councilTaxBand: z.string().optional().describe('The council tax band of the property.'),
  includeStreetNameDetail: z.boolean().optional().describe('Whether to include detailed street name information in the local summary.'),
  areaNameToSummarise: z.string().optional().describe('The specific area name to use for the local summary.'),
});
export type AnalyzeValuationDataInput = z.infer<
  typeof AnalyzeValuationDataInputSchema
>;

const LocalSummarySchema = z.object({
    amenities: z.string().describe('A summary of shops, restaurants, parks, and leisure facilities in the area.'),
    schools: z.string().describe('A summary of the local primary and secondary schools.'),
    transport: z.string().describe('A summary of the transport links, including train, bus, and major roads.'),
    character: z.string().describe('A paragraph about the general character and vibe of the area.'),
});
export type LocalSummary = z.infer<typeof LocalSummarySchema>;


const AnalyzeValuationDataOutputSchema = z.object({
  propertyAdvert: z
    .string()
    .describe(
      'A compelling property description with highlights and a full description, separated by "===DESCRIPTION===". The highlights should be a list of bullet points.'
    ),
  localSummary: LocalSummarySchema.optional()
});
export type AnalyzeValuationDataOutput = z.infer<
  typeof AnalyzeValuationDataOutputSchema
>;

export async function analyzeValuationData(
  input: AnalyzeValuationDataInput & { runAd?: boolean; runLocalSummary?: boolean }
): Promise<AnalyzeValuationDataOutput> {
  return analyzeValuationDataFlow(input);
}

const valuationAdPrompt = ai.definePrompt({
  name: 'valuationAdPrompt',
  input: {
    schema: z.object({
      photoDataUris: z.array(z.string()),
      propertyType: z.string().optional(),
      purchaseStyles: z.array(z.string()).optional(),
      councilTaxBand: z.string().optional(),
      localSummary: LocalSummarySchema.optional().describe('A summary of the local area, which can be used to add context to the property advert.'),
    }),
  },
  output: {
    schema: z.object({
      propertyAdvert: z.string(),
    }),
  },
  prompt: `You are an expert real estate agent creating a property listing for the UK market. Your tone must be factual and informative. You must avoid "fluffy" marketing language and long-winded terms. You must use UK English spellings.

Your task is to generate a "Property Highlights" list and a "Property Description".

1.  **Property Highlights**: Create a list of 10 bullet points. Each bullet point MUST start with a '*' and be on a new line. CRITICALLY, each bullet point MUST be in ALL CAPS (UPPERCASE) and MUST NOT end with a full stop.
    *   The highlights MUST be in a specific order:
        1.  The property type and purchase style. Use "{{propertyType}}" as the property type if it is provided. Use "{{#each purchaseStyles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}" as the purchase styles if they are provided. For example: "* DETACHED HOUSE, IDEAL FOR FAMILY HOME".
        2.  Features inside the property (e.g., KITCHEN, LIVING ROOM, BEDROOMS).
        3.  Features outside the property (e.g., GARDEN, DRIVEWAY, GARAGE).
    *   If the council tax band is provided as "{{councilTaxBand}}", include "COUNCIL TAX BAND: {{councilTaxBand}}" as one of the final bullet points.

2.  **Property Description**: This description MUST be a maximum of 2000 characters. Do not exceed this limit.
    *   This section must ONLY describe the house itself. Cover ALL aspects shown in the photos, including the exterior (gardens, driveway, overall appearance) and interior (features, flow, and ambiance).
    *   If purchase styles are provided ({{#each purchaseStyles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}), subtly weave in language that appeals to them. For example, for 'Family Home', mention a spacious garden. For 'First Time Buyer', mention potential for personalisation. For 'Investment', highlight rental potential.
    *   Do NOT include information about the local area, schools, or transport in this section.

3.  **Additional Information**: If a Local Area Summary is provided below, use it to write about the local amenities, schools, transport, and character of the area. This section should come AFTER the main property description.

Combine all parts into a single string, with the "Property Description" separated by "===DESCRIPTION===".

{{#if localSummary}}
<LocalAreaSummary>
{{{localSummary.amenities}}}
{{{localSummary.schools}}}
{{{localSummary.transport}}}
{{{localSummary.character}}}
</LocalAreaSummary>
{{/if}}

{{#each photoDataUris}}
Property Photo: {{media url=this}}
{{/each}}
`,
});

const localAreaPrompt = ai.definePrompt({
  name: 'localAreaSummaryPrompt',
  input: {
    schema: z.object({
      areaNameToSummarise: z.string(),
      postcode: z.string().optional(),
      includeStreetNameDetail: z.boolean().optional(),
    }),
  },
  output: {
    schema: z.object({
      localSummary: LocalSummarySchema.optional(),
    }),
  },
  tools: [postcodeLookup],
  prompt: `You are a local area expert for the UK. Your task is to provide a comprehensive summary for a potential homebuyer based on the area name "{{areaNameToSummarise}}"{{#if postcode}} in the postcode area "{{postcode}}"{{/if}}.

If you need more specific location data for the area, use the postcodeLookup tool.

IMPORTANT: You must use UK English spellings throughout (e.g., 'centre', 'colour').

Produce a summary of that area and populate the output object with the following information:

- amenities: Summarize shops, restaurants, parks, and leisure facilities in the area.
- schools: Summarize the local primary and secondary schools.
- transport: Summarize the transport links, including train, bus, and major roads.
- character: Provide a final paragraph about the general character and vibe of the area.

{{#if includeStreetNameDetail}}
Include specific details about prominent street names and the types of properties found on them in your final paragraph for the 'character' field.
{{/if}}

The entire summary should be engaging, formatted into easy-to-read paragraphs, and no more than 1000 words in total.`,
});

const analyzeValuationDataFlow = ai.defineFlow(
  {
    name: 'analyzeValuationDataFlow',
    inputSchema: AnalyzeValuationDataInputSchema.extend({
      runAd: z.boolean().optional(),
      runLocalSummary: z.boolean().optional(),
    }),
    outputSchema: AnalyzeValuationDataOutputSchema,
  },
  async input => {
    const output: AnalyzeValuationDataOutput = {
      propertyAdvert: '',
    };

    // Step 1: Generate Local Summary if requested
    let localSummary: LocalSummary | undefined;
    if (input.runLocalSummary && input.areaNameToSummarise) {
      try {
        const localAreaPromptInput: {
            areaNameToSummarise: string;
            postcode?: string;
            includeStreetNameDetail?: boolean;
        } = { areaNameToSummarise: input.areaNameToSummarise };

        if (input.postcode) localAreaPromptInput.postcode = input.postcode;
        if (input.includeStreetNameDetail) localAreaPromptInput.includeStreetNameDetail = input.includeStreetNameDetail;
        
        const localSummaryResult = await localAreaPrompt(localAreaPromptInput);
        if (localSummaryResult?.output?.localSummary) {
          localSummary = localSummaryResult.output.localSummary;
          output.localSummary = localSummary;
        }
      } catch (error) {
        console.error("Error generating local summary:", error);
        // Continue to ad generation even if local summary fails
      }
    }

    // Step 2: Generate Property Ad if requested
    if (input.runAd && input.photoDataUris.length > 0) {
      try {
        const adPromptInput: {
            photoDataUris: string[];
            propertyType?: string;
            purchaseStyles?: string[];
            councilTaxBand?: string;
            localSummary?: LocalSummary;
        } = { photoDataUris: input.photoDataUris };

        if (input.propertyType) adPromptInput.propertyType = input.propertyType;
        if (input.purchaseStyles) adPromptInput.purchaseStyles = input.purchaseStyles;
        if (input.councilTaxBand) adPromptInput.councilTaxBand = input.councilTaxBand;
        if (localSummary) adPromptInput.localSummary = localSummary;

        const adResult = await valuationAdPrompt(adPromptInput);
        if (adResult?.output?.propertyAdvert) {
          output.propertyAdvert = adResult.output.propertyAdvert;
        }
      } catch (error) {
        console.error("Error generating property advert:", error);
      }
    }
    
    return output;
  }
);
