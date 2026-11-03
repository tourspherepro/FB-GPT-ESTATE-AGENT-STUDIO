
'use server';
/**
 * @fileOverview An AI agent for generating a full, professional property valuation report.
 *
 * - generateValuationReport - A function that takes a property address and returns a structured valuation report.
 * - GenerateValuationReportInput - The input type for the generateValuationReport function.
 * - GenerateValuationReportOutput - The return type for the generateValuationReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateValuationReportInputSchema = z.object({
  address: z.string().describe('The full UK property address to generate a valuation report for.'),
});
export type GenerateValuationReportInput = z.infer<typeof GenerateValuationReportInputSchema>;

const GenerateValuationReportOutputSchema = z.object({
  report: z
    .string()
    .describe('A comprehensive valuation report in markdown format, structured with collapsible sections.'),
});
export type GenerateValuationReportOutput = z.infer<typeof GenerateValuationReportOutputSchema>;

export async function generateValuationReport(input: GenerateValuationReportInput): Promise<GenerateValuationReportOutput> {
  return generateValuationReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateValuationReportPrompt',
  input: { schema: GenerateValuationReportInputSchema },
  output: { schema: GenerateValuationReportOutputSchema },
  system: `You are an expert UK estate agent valuer with 20+ years of experience.
Your task is to analyse a user-provided UK property address and produce a full valuation report, in the same structure, depth, and tone as a professional estate agency market appraisal.

Output must be designed for a UI Valuation Tab inside “EA ANALYSE & DESCRIBE”, using:

✔ Collapsible sections (accordion-style)
✔ All sections expanded by default
✔ Clean screen-friendly formatting
✔ A vendor-friendly summary at the TOP
✔ Printable output (with a “Print to PDF” block at the bottom)

Never guess exact EPC details or sale dates unless typical patterns are stated.
When data is unknown, say “modelled”, “typically”, or “no confirmed record found”.
Never invent planning application IDs.
Never output URLs — only name the source (e.g., “Bricks&Logic”, “Homipi”, “StreetScan”).

You must produce a valuation report using the SAME structure and depth as this style:

Headline valuation → Facts → AVM → Benchmarks → Comparables → EPC → Planning → Area → Summary.

Sections must be vertically stacked for UI readability.
`,
  prompt: `
Generate a complete valuation analysis for:

PROPERTY ADDRESS: {{address}}

Use the following UI-structured collapsible format:

### 🔶 VENDOR BRIEF SUMMARY

Provide 5–8 bullet points only summarising:
• The recommended asking price
• Expected achieved price
• Number of comparable properties supporting the valuation
• EPC context
• Size/plot hierarchy
• Street/postcode benchmarks
• Area factors affecting demand
• Final valuer recommendation
(Make this concise and vendor-facing.)

---

### 🔽 SECTION 1 — Headline Valuation for {{address}}

Include:
• Tenure
• Property type
• Approx size (sq ft / m²)
• Plot size (if known)
• Beds / baths / receptions
• Construction style
• Last sold date & price (if known)
• EPC summary
• Gas/central heating, glazing
• Your valuation headline + confidence range
Reference sources by name only (Bricks&Logic, Homipi, EPC Register, StreetScan, Zoopla etc.)

---

### 🔽 SECTION 2 — Automated Valuation Benchmark (AVM)

• Modelled estimated value
• Low → mid → high condition bands
• Street value ranking (if known)
• Commentary on AVM confidence
Use Hazel Walk example formatting.

---

### 🔽 SECTION 3 — Local Street & Postcode Benchmarks

• Street average
• Postcode average
• Example valuations of nearby addresses
• Typical value brackets for detached/semi/terraced in postcode
(Use general market logic if data is missing.)

---

### 🔽 SECTION 4 — Comparable Sales (Most Relevant)

Provide 3–6 comparables:
• Address
• Property type
• Sale month/year
• Sale price
• Reason it is relevant
Use Hazel-Walk-style commentary.

---

### 🔽 SECTION 5 — Active Market Comparisons (For Sale)

If no live listings, say so.
Otherwise include:
• Address
• Asking price
• Type
• Why relevant
• Ceiling/floor implications

---

### 🔽 SECTION 6 — Valuation Opinion (Subject to Inspection)

Provide 3 separate valuation outcomes:

Modernised/good condition

Average condition

Dated / refurbishment needed

Include:
• Recommended asking price
• Expected sale price range
• Commentary on local demand
• Confidence rating

---

### 🔽 SECTION 7 — Evidence & Justification

Break into sub-sections:

a) Historical price growth

• Last sale date & price
• Growth since then
• Area performance trend

b) Size & street hierarchy

• Relative footprint vs neighbours
• Plot ranking
• “Above/below street average”

c) Comparative reasoning

Explain WHY comparables support the valuation.

---

### 🔽 SECTION 8 — EPC & Condition Commentary

• EPC rating explanation
• Impact on saleability
• Typical upgrade path
• % impact potential
• Buyers’ energy-efficiency expectations

---

### 🔽 SECTION 9 — Planning & Building Regulations

For the address:
• Whether any planning entries are modelled/known
• Nearby planning approvals
• Council behaviour (supportive / restrictive)
• Building Regs considerations (loft conversions, extensions)
• Advice to obtain certs
Never claim a planning application exists unless aggregated sources typically show similar trends.

---

### 🔽 SECTION 10 — Area & Neighbourhood Context

Include:
• Crime & deprivation (StreetScan/Homipi-style summary)
• Nature of street (quiet, cul-de-sac, through-road, estate-built)
• Age/style of surrounding homes
• Local value ceilings & floors

---

### 🔽 SECTION 11 — Transport, Schools & Amenities

• Rail distances
• Major roads
• Schools quality & proximity
• Hospitals (e.g., BRI)
• Key demand drivers

---

### 🔽 SECTION 12 — Final Valuer’s Summary

A short, professional paragraph summarising:
• Property type
• Recommended pricing strategy
• Saleability
• Risks
• Opportunities
• What price you expect to achieve
Should be ready to paste directly into printed valuation reports.

---
`,
});

const generateValuationReportFlow = ai.defineFlow(
  {
    name: 'generateValuationReportFlow',
    inputSchema: GenerateValuationReportInputSchema,
    outputSchema: GenerateValuationReportOutputSchema,
  },
  async ({ address }) => {
    const { output } = await prompt({ address });

    if (!output?.report) {
        throw new Error("Failed to generate a valuation report.");
    }
    
    // Add a placeholder for the PDF button which the UI will handle
    const finalReport = `${output.report}\n\n[Button: “Generate PDF Report”]`;
    
    return { report: finalReport };
  }
);
