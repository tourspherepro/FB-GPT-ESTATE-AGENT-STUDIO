
'use server';
/**
 * @fileOverview A tool for looking up location information from a UK postcode.
 *
 * - lookupPostcode - An async function that returns location data for a given postcode.
 */

import { z } from 'zod';

const PostcodeDataSchema = z.object({
    parish: z.string().optional(),
    admin_ward: z.string().optional(),
    admin_district: z.string().optional(),
    parliamentary_constituency: z.string().optional(),
    region: z.string().optional(),
});
export type PostcodeData = z.infer<typeof PostcodeDataSchema>;


// This function now calls the postcodes.io API to get accurate data.
export async function lookupPostcode(postcode: string): Promise<PostcodeData> {
    const sanitizedPostcode = postcode.replace(/\s/g, '').toUpperCase();

    try {
        const response = await fetch(`https://api.postcodes.io/postcodes/${sanitizedPostcode}`);
        if (!response.ok) {
            console.error(`Postcode lookup failed with status: ${response.status}`);
            return {};
        }
        const data = await response.json();

        if (data.status === 200 && data.result) {
            const result = data.result;
            return {
                parish: result.parish,
                admin_ward: result.admin_ward,
                admin_district: result.admin_district,
                parliamentary_constituency: result.parliamentary_constituency,
                region: result.region,
            };
        } else {
             return {};
        }

    } catch (error) {
        console.error('Error fetching from postcodes.io:', error);
        return {};
    }
}

