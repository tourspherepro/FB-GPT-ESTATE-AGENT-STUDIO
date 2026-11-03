
'use server';

/**
 * @fileOverview A client-callable flow for looking up postcode information.
 */

import {z} from 'zod';
import {lookupPostcode, type PostcodeData} from '../tools/postcode-lookup';

// This function is exported and can be called directly from client components.
export async function clientPostcodeLookup(
  postcode: string
): Promise<PostcodeData | null> {
  const PostcodeDataSchema = z.object({
      parish: z.string().optional().describe('The parish for the postcode.'),
      admin_ward: z.string().optional().describe('The administrative ward for the postcode.'),
      admin_district: z.string().optional().describe('The administrative district for the postcode.'),
      parliamentary_constituency: z.string().optional().describe('The parliamentary constituency for the postcode.'),
      region: z.string().optional().describe('The region for the postcode.'),
  });

  try {
    const result = await lookupPostcode(postcode);
    const parsed = PostcodeDataSchema.safeParse(result);
    if (parsed.success) {
      return parsed.data;
    }
    console.error('Postcode lookup validation failed:', parsed.error);
    return null;
  } catch (error) {
    console.error('Error in clientPostcodeLookup:', error);
    return null;
  }
}
