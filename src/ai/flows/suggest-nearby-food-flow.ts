'use server';
/**
 * @fileOverview A Genkit flow that suggests nearby food options based on a set of planned activities.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNearbyFoodInputSchema = z.object({
  prevActivity: z.object({
    name: z.string(),
    address: z.string(),
  }).optional(),
  nextActivity: z.object({
    name: z.string(),
    address: z.string(),
  }).optional(),
  mealType: z.string().default('Lunch'),
});

const FoodSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  address: z.string(),
  cuisine: z.string(),
  website: z.string().describe('Official website or booking link.'),
  reservationRecommended: z.boolean().describe('Whether a reservation is typically needed for this meal type.'),
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
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: SuggestNearbyFoodInputSchema },
  output: { schema: SuggestNearbyFoodOutputSchema },
  prompt: `You are an expert local food guide for the Boston and Merrimack Valley area.
The user is traveling between these two locations:
{{#if prevActivity}} - FROM: {{{prevActivity.name}}} at {{{prevActivity.address}}}{{/if}}
{{#if nextActivity}} - TO: {{{nextActivity.name}}} at {{{nextActivity.address}}}{{/if}}

Meal Type: {{{mealType}}}

Suggest 3 local, high-quality dining options that are physically "along the way" or very close to this route. 
Include at least one "iconic" choice if relevant.

For each suggestion, provide:
1. Name and Cuisine
2. A link to the website or Yelp page
3. Whether a reservation is recommended
4. A specific reason why it fits this route.`,
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
