'use server';
/**
 * @fileOverview A Genkit flow that suggests nearby food options based on a set of planned activities.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNearbyFoodInputSchema = z.object({
  activities: z.array(z.object({
    name: z.string(),
    address: z.string(),
  })),
});

const FoodSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  address: z.string(),
  cuisine: z.string(),
  reason: z.string().describe('Why this is a good stop along the route.'),
});

const SuggestNearbyFoodOutputSchema = z.object({
  suggestions: z.array(FoodSuggestionSchema),
});

export type SuggestNearbyFoodInput = z.infer<typeof SuggestNearbyFoodInputSchema>;
export type SuggestNearbyFoodOutput = z.infer<typeof SuggestNearbyFoodOutputSchema>;

export async function suggestNearbyFood(input: SuggestNearbyFoodInput): Promise<SuggestNearbyFoodOutput> {
  return suggestNearbyFoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNearbyFoodPrompt',
  input: { schema: SuggestNearbyFoodInputSchema },
  output: { schema: SuggestNearbyFoodOutputSchema },
  prompt: `You are an expert local food guide for the Boston and Merrimack Valley area.
The user is traveling along this route:
{{#each activities}}
- {{{name}}} at {{{address}}}
{{/each}}

Suggest 3 local, high-quality dining options that are physically "along the way" or very close to these stops. 
Include at least one "iconic" choice (like a North End bakery or a Tewksbury landmark) if relevant to the route.

For each suggestion, provide the name, description, address, cuisine, and a reason why it fits this specific route.`,
});

const suggestNearbyFoodFlow = ai.defineFlow(
  {
    name: 'suggestNearbyFoodFlow',
    inputSchema: SuggestNearbyFoodInputSchema,
    outputSchema: SuggestNearbyFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
