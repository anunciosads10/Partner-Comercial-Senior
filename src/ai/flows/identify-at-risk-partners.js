'use server';

/**
 * @fileOverview Un flujo que identifica a los partners en riesgo de abandono utilizando datos históricos y GenAI.
 *
 * - identifyAtRiskPartners - Una función que analiza los datos de los partners y predice el riesgo de abandono.
 * - IdentifyAtRiskPartnersInput - El tipo de entrada para la función identifyAtRiskPartners.
 * - IdentifyAtRiskPartnersOutput - El tipo de retorno para la función identifyAtRiskPartners.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyAtRiskPartnersInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Datos históricos de los partners, incluyendo rendimiento de ventas, métricas de participación y otros datos relevantes.'
    ),
});


const IdentifyAtRiskPartnersOutputSchema = z.object({
  atRiskPartners: z
    .array(z.string())
    .describe('Una lista de IDs de partners que se identifican como en riesgo de abandono.'),
  reasons: z
    .array(z.string())
    .describe('Razones por las que cada partner ha sido identificado como en riesgo.'),
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
  prompt: `Eres un experto en gestión de relaciones con partners y predicción de abandono.

  Analiza los siguientes datos históricos de nuestros partners e identifica a aquellos que están en riesgo de abandonar.

  Datos Históricos: {{{historicalData}}}

  Proporciona una lista de IDs de partners que están en riesgo de abandonar y las razones de cada uno.

  Formatea tu respuesta como un objeto JSON con la siguiente estructura:
  {
    "atRiskPartners": ["partnerId1", "partnerId2", ...],
    "reasons": ["Razón para partnerId1", "Razón para partnerId2", ...]
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
