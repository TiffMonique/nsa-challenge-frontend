'use server';

/**
 * @fileOverview An AI agent that suggests similar exoplanets based on input parameters.
 *
 * - suggestSimilarExoplanets - A function that handles the suggestion of similar exoplanets.
 * - SuggestSimilarExoplanetsInput - The input type for the suggestSimilarExoplanets function.
 * - SuggestSimilarExoplanetsOutput - The return type for the suggestSimilarExoplanets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarExoplanetsInputSchema = z.object({
  planetName: z.string().describe('The name of the confirmed exoplanet.'),
  planetRadius: z.number().describe('The radius of the exoplanet (in Earth radii).'),
  orbitalPeriod: z.number().describe('The orbital period of the exoplanet (in days).'),
  stellarTemperature: z.number().describe('The temperature of the host star (in Kelvin).'),
});
export type SuggestSimilarExoplanetsInput = z.infer<typeof SuggestSimilarExoplanetsInputSchema>;

const SuggestSimilarExoplanetsOutputSchema = z.object({
  similarExoplanets: z
    .array(z.string())
    .describe('A list of names of exoplanets similar to the input exoplanet.'),
  reasoning: z.string().describe('The AI explanation for why these exoplanets are similar.'),
});
export type SuggestSimilarExoplanetsOutput = z.infer<typeof SuggestSimilarExoplanetsOutputSchema>;

export async function suggestSimilarExoplanets(
  input: SuggestSimilarExoplanetsInput
): Promise<SuggestSimilarExoplanetsOutput> {
  return suggestSimilarExoplanetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarExoplanetsPrompt',
  input: {schema: SuggestSimilarExoplanetsInputSchema},
  output: {schema: SuggestSimilarExoplanetsOutputSchema},
  prompt: `You are an expert in exoplanetary science. Given the following information about an exoplanet, identify up to 3 other known exoplanets with similar characteristics and explain your reasoning.\n\nExoplanet Name: {{{planetName}}}\nPlanet Radius (Earth radii): {{{planetRadius}}}\nOrbital Period (days): {{{orbitalPeriod}}}\nStellar Temperature (Kelvin): {{{stellarTemperature}}}\n\nFormat your response as follows:\nSimilar Exoplanets: [Exoplanet1, Exoplanet2, Exoplanet3]\nReasoning: Explanation of why these exoplanets are similar.`,
});

const suggestSimilarExoplanetsFlow = ai.defineFlow(
  {
    name: 'suggestSimilarExoplanetsFlow',
    inputSchema: SuggestSimilarExoplanetsInputSchema,
    outputSchema: SuggestSimilarExoplanetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
