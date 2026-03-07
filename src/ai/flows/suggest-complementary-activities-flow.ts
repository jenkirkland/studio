'use server';
/**
 * @fileOverview A Genkit flow that suggests complementary activities based on current selections and available time.
 *
 * - suggestComplementaryActivities - A function that handles the activity suggestion process.
 * - SuggestComplementaryActivitiesInput - The input type for the suggestComplementaryActivities function.
 * - SuggestComplementaryActivitiesOutput - The return type for the suggestComplementaryActivities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema (Not exported as an object to comply with 'use server' constraints)
const ActivityDetailsSchema = z.object({
  name: z.string().describe('The name of the activity.'),
  description: z.string().describe('A brief description of the activity.'),
  type: z.string().describe('The category or type of the activity (e.g., "nature", "food", "historical").'),
  durationMinutes: z.number().describe('The estimated duration of the activity in minutes.'),
  address: z.string().optional().describe('The address of the activity.'),
  googleMapsUrl: z.string().url().optional().describe('Optional Google Maps URL for the activity.'),
});

const SuggestComplementaryActivitiesInputSchema = z.object({
  selectedActivities: z.array(ActivityDetailsSchema).describe('A list of activities already selected for the day, providing context for complementary suggestions.'),
  allPotentialActivities: z.array(ActivityDetailsSchema).describe('A comprehensive list of all available activities from which to suggest new ones.'),
  remainingBudgetedMinutes: z.number().describe('The total number of minutes still available for new activities in the current planning period.'),
});
export type SuggestComplementaryActivitiesInput = z.infer<typeof SuggestComplementaryActivitiesInputSchema>;

// Output Schema
const SuggestedActivitySchema = z.object({
  name: z.string().describe('The name of the suggested activity.'),
  reason: z.string().describe('A brief explanation of why this activity is suggested and how it complements the existing plan.'),
});

const SuggestComplementaryActivitiesOutputSchema = z.object({
  suggestedActivities: z.array(SuggestedActivitySchema).describe('A list of activities recommended to complement the current selection.'),
  totalSuggestedDurationMinutes: z.number().describe('The combined duration of all suggested activities in minutes.'),
});
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
  prompt: `You are an AI assistant designed to help users plan their day by suggesting complementary activities.
The user is planning a day trip starting in Tewksbury, MA.

Here are the activities already selected for the day:
{{#if selectedActivities}}
{{#each selectedActivities}}
- Name: {{{name}}}, Type: {{{type}}}, Duration: {{{durationMinutes}}} minutes, Description: {{{description}}}
{{/each}}
{{else}}
No activities have been selected yet.
{{/if}}

Here is a list of all potential activities you can suggest from. Each of these activities has a name, description, type, and duration:
{{#each allPotentialActivities}}
- Name: {{{name}}}, Type: {{{type}}}, Duration: {{{durationMinutes}}} minutes, Description: {{{description}}}
{{/each}}

The user has approximately {{{remainingBudgetedMinutes}}} minutes remaining to fill with new activities.

Your goal is to suggest 1 to 3 complementary activities from the 'allPotentialActivities' list that:
1.  Complement the 'selectedActivities' (e.g., if many outdoor activities are selected, suggest another outdoor one, or perhaps a food break).
2.  Crucially, the combined duration of ALL your suggested activities MUST NOT exceed the 'remainingBudgetedMinutes'. Try to utilize as much of the remaining time as possible without going over.
3.  Are NOT already in the 'selectedActivities' list.
4.  Focus on variety and local experiences, considering the Tewksbury, MA context.

For each suggested activity, provide its 'name' and a 'reason' why it's a good complement.
If no activities are selected, suggest 1-3 popular or diverse options that fit the remaining time.

Please respond with a JSON object conforming to the output schema.
`,
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

    let totalSuggestedDuration = 0;
    if (output && output.suggestedActivities) {
      for (const suggested of output.suggestedActivities) {
        const fullActivity = input.allPotentialActivities.find(
          (activity) => activity.name === suggested.name
        );
        if (fullActivity) {
          totalSuggestedDuration += fullActivity.durationMinutes;
        }
      }
    }

    if (output) {
      return {
        suggestedActivities: output.suggestedActivities,
        totalSuggestedDurationMinutes: totalSuggestedDuration,
      };
    } else {
      return {
        suggestedActivities: [],
        totalSuggestedDurationMinutes: 0,
      };
    }
  }
);
