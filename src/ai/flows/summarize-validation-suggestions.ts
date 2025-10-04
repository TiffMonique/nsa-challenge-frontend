'use server';

/**
 * @fileOverview Summarizes validation suggestions for false positive exoplanet candidates.
 *
 * - summarizeValidationSuggestions - A function that summarizes validation suggestions.
 * - SummarizeValidationSuggestionsInput - The input type for the summarizeValidationSuggestions function.
 * - SummarizeValidationSuggestionsOutput - The return type for the summarizeValidationSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeValidationSuggestionsInputSchema = z.object({
  validationSuggestions: z
    .string()
    .describe('The validation suggestions to summarize.'),
});
export type SummarizeValidationSuggestionsInput = z.infer<
  typeof SummarizeValidationSuggestionsInputSchema
>;

const SummarizeValidationSuggestionsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the validation suggestions.'),
});
export type SummarizeValidationSuggestionsOutput = z.infer<
  typeof SummarizeValidationSuggestionsOutputSchema
>;

export async function summarizeValidationSuggestions(
  input: SummarizeValidationSuggestionsInput
): Promise<SummarizeValidationSuggestionsOutput> {
  return summarizeValidationSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeValidationSuggestionsPrompt',
  input: {schema: SummarizeValidationSuggestionsInputSchema},
  output: {schema: SummarizeValidationSuggestionsOutputSchema},
  prompt: `You are an expert in summarizing validation suggestions for exoplanet candidates that have been identified as false positives.

  Given the following validation suggestions, provide a concise summary of the key steps for further investigation:

  Validation Suggestions: {{{validationSuggestions}}}

  Summary: `,
});

const summarizeValidationSuggestionsFlow = ai.defineFlow(
  {
    name: 'summarizeValidationSuggestionsFlow',
    inputSchema: SummarizeValidationSuggestionsInputSchema,
    outputSchema: SummarizeValidationSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
