'use server';
/**
 * @fileOverview A Genkit flow that searches for event details to auto-populate the custom activity form.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchCustomEventInputSchema = z.object({
  query: z.string().describe('The name of the event or place to find.'),
});

const SearchResultSchema = z.object({
  name: z.string(),
  address: z.string(),
  description: z.string(),
  suggestedDurationMinutes: z.number().default(60),
  category: z.string().optional(),
});

const SearchCustomEventOutputSchema = z.object({
  results: z.array(SearchResultSchema),
});

export type SearchCustomEventInput = z.infer<typeof SearchCustomEventInputSchema>;
export type SearchCustomEventOutput = z.infer<typeof SearchCustomEventOutputSchema>;

export async function searchCustomEvent(input: SearchCustomEventInput): Promise<SearchCustomEventOutput> {
  return searchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchCustomEventPrompt',
  model: 'googleai/gemini-1.5-pro',
  input: { schema: SearchCustomEventInputSchema },
  output: { schema: SearchCustomEventOutputSchema },
  prompt: `You are a travel assistant. A user is looking for details about an event or place: "{{{query}}}".

Find the most likely candidates for this in the Boston/Massachusetts area.
Return a list of details including the full street address and a typical duration a visitor spends there.`,
});

const searchFlow = ai.defineFlow(
  {
    name: 'searchCustomEventFlow',
    inputSchema: SearchCustomEventInputSchema,
    outputSchema: SearchCustomEventOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
