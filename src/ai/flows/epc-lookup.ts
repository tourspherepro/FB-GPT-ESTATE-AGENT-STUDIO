
'use server';

/**
 * @fileOverview A secure flow for searching the EPC register.
 *
 * - epcSearch - A function that takes a postcode and returns a list of EPC records.
 * - EpcSearchInput - The input type for the epcSearch function.
 * - EpcSearchResult - The return type for the epcSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EpcSearchInputSchema = z.object({
  postcode: z.string().describe('The postcode to search for.'),
});
export type EpcSearchInput = z.infer<typeof EpcSearchInputSchema>;

const EpcCertificateSchema = z.object({
  lmkKey: z.string(),
  address: z.string(),
  lodgementDate: z.string(),
  expiryDate: z.string(),
  currentEnergyRating: z.string(),
  councilTaxBand: z.string().optional(),
});
export type EpcCertificate = z.infer<typeof EpcCertificateSchema>;

const EpcSearchResultSchema = z.object({
  certificates: z.array(EpcCertificateSchema),
});
export type EpcSearchResult = z.infer<typeof EpcSearchResultSchema>;

export async function epcSearch(
  input: EpcSearchInput
): Promise<EpcSearchResult> {
  return epcSearchFlow(input);
}

// Helper function to fetch details for a single certificate
async function fetchCertificateDetails(lmkKey: string, token: string): Promise<any | null> {
  const detailUrl = `https://epc.opendatacommunities.org/api/v1/domestic/certificate/${lmkKey}`;
  try {
    const response = await fetch(detailUrl, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      console.error(`Failed to fetch details for LMK Key ${lmkKey}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data.rows[0]; // Return the full data object
  } catch (error) {
    console.error(`Error fetching details for LMK Key ${lmkKey}:`, error);
    return null;
  }
}

// Exported client-callable function
export async function fetchCertificateDetailsClient(lmkKey: string): Promise<any | null> {
    const token = 'VE9VUlNQSEVSRVBST0BHTUFJTC5DT006YjNkYzdjNTAwZjI5Nzg0ZGZjZDZjY2E2MmRkMTA3NGEyODYxZmZmMw==';
    return fetchCertificateDetails(lmkKey, token);
}


const epcSearchFlow = ai.defineFlow(
  {
    name: 'epcSearchFlow',
    inputSchema: EpcSearchInputSchema,
    outputSchema: EpcSearchResultSchema,
  },
  async ({ postcode }) => {
    const token = 'VE9VUlNQSEVSRVBST0BHTUFJTC5DT006YjNkYzdjNTAwZjI5Nzg0ZGZjZDZjY2E2MmRkMTA3NGEyODYxZmZmMw==';
    
    const url = `https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=${encodeURIComponent(postcode)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`EPC API request failed with status: ${response.status}`, errorBody);
        throw new Error(`API request failed: ${response.statusText} (Status: ${response.status})`);
      }

      const data = await response.json();
      
      const certificates = data.rows.map((cert: any) => {
        return {
          lmkKey: cert['lmk-key'],
          address: cert.address,
          lodgementDate: 'N/A', // Minimal data for list view
          expiryDate: 'N/A',
          currentEnergyRating: cert['current-energy-rating'],
          councilTaxBand: cert['council-tax-band'],
        };
      });

      // Sort certificates by address numerically
      certificates.sort((a: any, b: any) => {
        const numA = parseInt(a.address.match(/^\d+/) ? a.address.match(/^\d+/)[0] : '0', 10);
        const numB = parseInt(b.address.match(/^\d+/) ? b.address.match(/^\d+/)[0] : '0', 10);
        return numA - numB;
      });


      return { certificates };

    } catch (error) {
      console.error('Error fetching EPC data:', error);
      throw new Error('Failed to fetch EPC data.');
    }
  }
);
