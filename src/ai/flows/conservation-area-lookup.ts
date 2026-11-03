'use server';

/**
 * @fileOverview A flow for checking if a location is within a conservation area.
 * 
 * - lookupConservationArea - A function that takes a postcode and returns conservation area details.
 * - ConservationAreaResult - The type for the conservation area lookup result.
 */

import { z } from 'zod';

const ConservationAreaResultSchema = z.object({
  inConservationArea: z.boolean(),
  areaName: z.string().optional(),
  designationDate: z.number().optional(),
  url: z.string().optional(),
});
export type ConservationAreaResult = z.infer<typeof ConservationAreaResultSchema>;

export async function lookupConservationArea(postcode: string): Promise<ConservationAreaResult> {
  // 1. Convert postcode to lat/lng
  const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
  if (!postcodeResponse.ok) {
      const errorText = await postcodeResponse.text();
      console.error("Postcode API Error:", errorText);
      throw new Error(`Failed to convert postcode to coordinates. Status: ${postcodeResponse.status}`);
  }
  const postcodeData = await postcodeResponse.json();
  const { longitude, latitude } = postcodeData.result;

  if (!longitude || !latitude) {
      throw new Error('Invalid coordinates received from postcode lookup.');
  }

  // 2. Query the ArcGIS FeatureServer
  const arcgisUrl = `https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Conservation_Areas/FeatureServer/0/query`;
  
  const params = new URLSearchParams({
      geometry: `${longitude},${latitude}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'cons_area,desig_date,url',
      returnGeometry: 'false',
      f: 'json'
  });

  const conservationResponse = await fetch(`${arcgisUrl}?${params.toString()}`);
  if (!conservationResponse.ok) {
      const errorText = await conservationResponse.text();
      console.error("ArcGIS API Error:", errorText);
      throw new Error(`Failed to query the Conservation Area service. Status: ${conservationResponse.status}`);
  }
  
  const conservationData = await conservationResponse.json();

  if (conservationData.features && conservationData.features.length > 0) {
    const attributes = conservationData.features[0].attributes;
    return {
      inConservationArea: true,
      areaName: attributes.cons_area,
      designationDate: attributes.desig_date,
      url: attributes.url,
    };
  } else {
    return {
      inConservationArea: false,
    };
  }
}

    