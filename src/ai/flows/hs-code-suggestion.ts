// src/ai/flows/hs-code-suggestion.ts
'use server';
import "server-only"; // Ensures this module is only used on the server

/**
 * @fileOverview An HS code suggestion AI agent.
 *
 * - suggestHsCode - A function that suggests HS codes based on a product description.
 * - SuggestHsCodeInput - The input type for the suggestHsCode function.
 * - SuggestHsCodeOutput - The return type for the suggestHsCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHsCodeInputSchema = z.object({
  productDescription: z
    .string()
    .describe('The description of the product for which an HS code is needed.'),
});
export type SuggestHsCodeInput = z.infer<typeof SuggestHsCodeInputSchema>;

const SuggestHsCodeOutputSchema = z.object({
  hsCode: z
    .string()
    .describe('El código HS sugerido para el producto, seguido de dos puntos y una explicación detallada en español. Ejemplo: "1234.56.78: Esta es la explicación detallada en español."'),
});
export type SuggestHsCodeOutput = z.infer<typeof SuggestHsCodeOutputSchema>;

export async function suggestHsCode(input: SuggestHsCodeInput): Promise<SuggestHsCodeOutput> {
  return suggestHsCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHsCodePrompt',
  input: {schema: SuggestHsCodeInputSchema},
  output: {schema: SuggestHsCodeOutputSchema},
  prompt: `Eres un experto en comercio internacional y regulaciones aduaneras. Tu tarea es sugerir el código del Sistema Armonizado (HS Code) más apropiado para un producto.

  IMPORTANTE: Toda tu respuesta debe estar en ESPAÑOL.

  Basado en la siguiente descripción del producto, sugiere el código HS más adecuado.
  Descripción del Producto: {{{productDescription}}}

  Tu respuesta DEBE SEGUIR ESTE FORMATO EXACTO: "<CÓDIGO_HS_SUGERIDO>: <EXPLICACIÓN_DETALLADA_EN_ESPAÑOL>"
  Por ejemplo: "8517.12.00: Teléfonos móviles (celulares) y otros teléfonos que operan en redes inalámbricas. La explicación detallada debe justificar por qué este código es el más apropiado, basándose en las características del producto descrito."

  Asegúrate de que el código HS sea preciso y se ajuste a los estándares internacionales. La explicación debe ser clara, concisa y útil para alguien que necesite clasificar el producto.
  `,
});

const suggestHsCodeFlow = ai.defineFlow(
  {
    name: 'suggestHsCodeFlow',
    inputSchema: SuggestHsCodeInputSchema,
    outputSchema: SuggestHsCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
