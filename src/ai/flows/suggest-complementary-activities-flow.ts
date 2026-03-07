'use server';
/**
 * @fileOverview A Genkit flow that suggests complementary activities based on current selections and available time.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas (internal)
const ActivityDetailsSchema = z.object({
  name: z.string().describe('The name of the activity.'),
  description: z.string().describe('A brief description of the activity.'),
  type: z.string().describe('The category or type of the activity.'),
  durationMinutes: z.number().describe('Estimated duration in minutes.'),
  address: z.string().optional().describe('The address of the activity.'),
});

const SuggestComplementaryActivitiesInputSchema = z.object({
  selectedActivities: z.array(ActivityDetailsSchema),
  allPotentialActivities: z.array(ActivityDetailsSchema),
  remainingBudgetedMinutes: z.number(),
});

const SuggestedActivitySchema = z.object({
  name: z.string(),
  reason: z.string(),
});

const SuggestComplementaryActivitiesOutputSchema = z.object({
  suggestedActivities: z.array(SuggestedActivitySchema),
  totalSuggestedDurationMinutes: z.number(),
});

// Types (exported)
export type SuggestComplementaryActivitiesInput = z.infer<typeof SuggestComplementaryActivitiesInputSchema>;
export type SuggestComplementaryActivitiesOutput = z.infer<typeof SuggestComplementaryActivitiesOutputSchema>;

// Exported wrapper function
export async function suggestComplementaryActivities(input: SuggestComplementaryActivitiesInput): Promise<SuggestComplementaryActivitiesOutput> {
  return suggestComplementaryActivitiesFlow(input);
}

// Prompt Definition
const prompt = ai.definePrompt({
  name: 'suggestComplementaryActivitiesPrompt',
  input: {schema: SuggestComplementaryActivitiesInputSchema},
  output: {schema: SuggestComplementaryActivitiesOutputSchema},
  prompt: `You are an AI assistant designed to help users plan their day trip starting in Tewksbury, MA.

Current itinerary:
{{#if selectedActivities}}
{{#each selectedActivities}}
- {{{name}}} ({{{type}}}, {{{durationMinutes}}} mins): {{{description}}}
{{/each}}
{{else}}
No activities selected.
{{/if}}

Remaining time: {{{remainingBudgetedMinutes}}} minutes.

Choose 1-3 activities from this list that complement the current plan without exceeding the remaining time:
{{#each allPotentialActivities}}
- {{{name}}} ({{{type}}}, {{{durationMinutes}}} mins): {{{description}}}
{{/each}}

Provide a brief 'reason' for each suggestion.`,
});

// Flow Definition
const suggestComplementaryActivitiesFlow = ai.defineFlow(
  {
    name: 'suggestComplementaryActivitiesFlow',
    inputSchema: SuggestComplementaryActivitiesInputSchema,
    outputSchema: SuggestComplementaryActivitiesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    let totalDuration = 0;
    if (output?.suggestedActivities) {
      for (const suggested of output.suggestedActivities) {
        const full = input.allPotentialActivities.find(a => a.name === suggested.name);
        if (full) totalDuration += full.durationMinutes;
      }
    }

    return {
      suggestedActivities: output?.suggestedActivities || [],
      totalSuggestedDurationMinutes: totalDuration,
    };
  }
);