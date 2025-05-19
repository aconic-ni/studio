// src/ai/flows/hs-code-suggestion.ts
'use server';
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
    .describe('The suggested HS code for the product, with a brief explanation.'),
});
export type SuggestHsCodeOutput = z.infer<typeof SuggestHsCodeOutputSchema>;

export async function suggestHsCode(input: SuggestHsCodeInput): Promise<SuggestHsCodeOutput> {
  return suggestHsCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHsCodePrompt',
  input: {schema: SuggestHsCodeInputSchema},
  output: {schema: SuggestHsCodeOutputSchema},
  prompt: `You are an expert in international trade and customs regulations.

  Based on the following product description, suggest the most appropriate Harmonized System (HS) code. Provide a brief explanation for your suggestion.

  Product Description: {{{productDescription}}}

  Ensure the HS code is accurate and conforms to international standards.
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
