'use server';
/**
 * @fileOverview A Genkit flow that refines an itinerary based on natural language feedback.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number(),
});

const DaySchema = z.object({
  name: z.string(),
  activities: z.array(ActivitySchema),
});

const RefineInputSchema = z.object({
  currentItinerary: z.array(DaySchema),
  userPrompt: z.string(),
});

const RefineOutputSchema = z.object({
  updatedItinerary: z.array(DaySchema),
  explanation: z.string().describe('Explain what changes were made based on the request.'),
});

export type RefineInput = z.infer<typeof RefineInputSchema>;
export type RefineOutput = z.infer<typeof RefineOutputSchema>;

export async function refineItineraryChat(input: RefineInput): Promise<RefineOutput> {
  return refineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineItineraryPrompt',
  model: 'googleai/gemini-1.5-pro',
  input: { schema: RefineInputSchema },
  output: { schema: RefineOutputSchema },
  prompt: `You are an itinerary assistant. A user wants to modify their current plan.

Current Itinerary:
{{#each currentItinerary}}
Day: {{{name}}}
Activities:
{{#each activities}}
- {{{name}}} ({{{type}}}, {{{startTime}}} - {{{endTime}}})
{{/each}}
{{/each}}

User Request: "{{{userPrompt}}}"

Apply the changes requested. If they don't want two similar activities on the same day, move one to a different day or suggest a replacement from your general knowledge of the area. Maintain a logical flow and respect timing.`,
});

const refineFlow = ai.defineFlow(
  {
    name: 'refineFlow',
    inputSchema: RefineInputSchema,
    outputSchema: RefineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
