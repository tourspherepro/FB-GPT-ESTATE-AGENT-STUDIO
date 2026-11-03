'use server';

/**
 * @fileOverview An AI agent for analyzing real estate data, including images and postcodes,
 * to generate property adverts and a local area summary.
 *
 * - analyzeRealEstateData - A function that takes real estate data as input and returns a property advert and a local summary.
 * - AnalyzeRealEstateDataInput - The input type for the analyzeRealEstateData function.
 * - AnalyzeRealEstateDataOutput - The return type for the analyzeRealestateData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { lookupPostcode } from '../tools/postcode-lookup';
import { Part } from 'genkit/model';


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

const LocalSummarySchema = z.object({
    amenities: z.string().describe('A summary of shops, restaurants, parks, and leisure facilities in the area.'),
    schools: z.string().describe('A summary of the local primary and secondary schools.'),
    transport: z.string().describe('A summary of the transport links, including train, bus, and major roads.'),
    character: z.string().describe('A paragraph about the general character and vibe of the area.'),
});
export type LocalSummary = z.infer<typeof LocalSummarySchema>;


const AnalyzeRealEstateDataInputSchema = z.object({
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
  bedrooms: z.string().optional().describe('The number of bedrooms.'),
  receptionRooms: z.string().optional().describe('The number of reception rooms.'),
  bathrooms: z.string().optional().describe('The number of bathrooms.'),
  purchaseStyles: z.array(z.string()).optional().describe('An array of purchase styles, e.g., "Family Home", "First Time Buyer", "Investment".'),
  councilTaxBand: z.string().optional().describe('The council tax band of the property.'),
  epcRating: z.string().optional().describe('The EPC rating of the property (e.g., "C").'),
  includeStreetNameDetail: z.boolean().optional().describe('Whether to include detailed street name information in the local summary.'),
  areaNameToSummarise: z.string().optional().describe('The specific area name to use for the local summary.'),
  localSummary: LocalSummarySchema.optional().describe('An optional, pre-generated local summary to be used for the property advert.'),
});
export type AnalyzeRealEstateDataInput = z.infer<
  typeof AnalyzeRealEstateDataInputSchema
>;

const PropertyAdvertSchema = z.object({
    highlights: z.string().describe("A bulleted list of key selling points, each starting with a '*'. Separate points with newlines."),
    description: z.string().describe("An engaging narrative description of the property based on the photos."),
});

const AnalyzeRealEstateDataOutputSchema = z.object({
  propertyAdvert: PropertyAdvertSchema.optional(),
  localSummary: LocalSummarySchema.optional()
});
export type AnalyzeRealEstateDataOutput = z.infer<
  typeof AnalyzeRealEstateDataOutputSchema
>;

export async function analyzeRealEstateData(
  input: AnalyzeRealEstateDataInput & { runAd?: boolean; runLocalSummary?: boolean }
): Promise<AnalyzeRealEstateDataOutput> {
  return analyzeRealEstateDataFlow(input);
}

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

const analyzeRealEstateDataFlow = ai.defineFlow(
  {
    name: 'analyzeRealEstateDataFlow',
    inputSchema: AnalyzeRealEstateDataInputSchema.extend({
      runAd: z.boolean().optional(),
      runLocalSummary: z.boolean().optional(),
    }),
    outputSchema: AnalyzeRealEstateDataOutputSchema,
  },
  async input => {
    let localSummary: LocalSummary | undefined = input.localSummary;
    
    if (input.runLocalSummary && input.areaNameToSummarise) {
        const localAreaResult = await localAreaPrompt({
          areaNameToSummarise: input.areaNameToSummarise,
          postcode: input.postcode,
          includeStreetNameDetail: input.includeStreetNameDetail,
        });
        if (localAreaResult?.output?.localSummary) {
          localSummary = localAreaResult.output.localSummary;
        }
    }

    let propertyAdvert: z.infer<typeof PropertyAdvertSchema> | undefined;
    if (input.runAd) {
        const textPrompt = `You are an expert UK real estate agent.
Based on the provided photos and property information, generate a property listing.

The output must be a JSON object with two fields: 'highlights' and 'description'.

- 'highlights': A bulleted list of the most attractive selling points, starting each with a '*'.
- 'description': An engaging, narrative description of the property, focusing on what is visible in the photos.

Property Information:
- Type: ${input.propertyType || 'Not specified'}
- Bedrooms: ${input.bedrooms || 'Not specified'}
- Reception Rooms: ${input.receptionRooms || 'Not specified'}
- Bathrooms: ${input.bathrooms || 'Not specified'}
- Ideal buyer types: ${input.purchaseStyles?.join(', ') || 'Not specified'}
- EPC Rating: ${input.epcRating || 'Not specified'}
- Council Tax: ${input.councilTaxBand || 'Not specified'}

Analyze the provided photos to create the content.
`;

        const promptParts: Part[] = [{ text: textPrompt }];
        if (input.photoDataUris && input.photoDataUris.length > 0) {
            input.photoDataUris.forEach(uri => {
                promptParts.push({ media: { url: uri } });
            });
        }

        const adResult = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            prompt: promptParts,
            output: {
                schema: PropertyAdvertSchema,
            },
        });

        if (adResult.output) {
            propertyAdvert = adResult.output;
        } else {
            let errorMessage = "Could not generate property advert.";
            if (adResult.finishReason !== 'stop') {
      errorMessage += ` Reason: ${adResult.finishReason}`;
    } else {
                errorMessage += " The AI returned an empty or invalid response, which may be due to safety filters or an internal model error.";
            }
            throw new Error(errorMessage);
        }
    }
    
    const output: AnalyzeRealEstateDataOutput = {
      propertyAdvert: propertyAdvert,
      localSummary: localSummary,
    };
    
    return output;
  }
);
