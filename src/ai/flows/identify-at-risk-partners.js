'use server';

/**
 * @fileOverview A flow that identifies partners at risk of churning using historical data and GenAI.
 *
 * - identifyAtRiskPartners - A function that analyzes partner data and predicts churn risk.
 * - IdentifyAtRiskPartnersInput - The input type for the identifyAtRiskPartners function.
 * - IdentifyAtRiskPartnersOutput - The return type for the identifyAtRiskPartners function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyAtRiskPartnersInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical data of partners, including sales performance, engagement metrics, and other relevant data.'
    ),
});


const IdentifyAtRiskPartnersOutputSchema = z.object({
  atRiskPartners: z
    .array(z.string())
    .describe('A list of partner IDs who are identified as at risk of churning.'),
  reasons: z
    .array(z.string())
    .describe('Reasons for each partner being identified as at risk.'),
});


export async function identifyAtRiskPartners(
  input
) {
  return identifyAtRiskPartnersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyAtRiskPartnersPrompt',
  input: {schema: IdentifyAtRiskPartnersInputSchema},
  output: {schema: IdentifyAtRiskPartnersOutputSchema},
  prompt: `You are an expert in partner relationship management and churn prediction.

  Analyze the following historical data of our partners and identify those who are at risk of churning.

  Historical Data: {{{historicalData}}}

  Provide a list of partner IDs who are at risk of churning and the reasons for each partner being identified as at risk.

  Format your response as a JSON object with the following structure:
  {
    "atRiskPartners": ["partnerId1", "partnerId2", ...],
    "reasons": ["Reason for partnerId1", "Reason for partnerId2", ...]
  }
  `,
});

const identifyAtRiskPartnersFlow = ai.defineFlow(
  {
    name: 'identifyAtRiskPartnersFlow',
    inputSchema: IdentifyAtRiskPartnersInputSchema,
    outputSchema: IdentifyAtRiskPartnersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);
