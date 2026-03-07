'use server';
/**
 * @fileOverview A Genkit flow that optimizes the order of activities for a day trip.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  type: z.string(),
  address: z.string(),
});

const OptimizeInputSchema = z.object({
  activities: z.array(ActivitySchema),
  startHour: z.number().default(9),
});

const OptimizedItemSchema = z.object({
  type: z.enum(['activity', 'meal']),
  id: z.string().optional(),
  name: z.string(),
  startTime: z.string().describe('Format: HH:MM AM/PM'),
  durationMinutes: z.number(),
  reason: z.string().optional(),
});

const OptimizeOutputSchema = z.object({
  itinerary: z.array(OptimizedItemSchema),
  totalDurationMinutes: z.number(),
});

export type OptimizeInput = z.infer<typeof OptimizeInputSchema>;
export type OptimizeOutput = z.infer<typeof OptimizeOutputSchema>;

export async function optimizeItinerary(input: OptimizeInput): Promise<OptimizeOutput> {
  return optimizeFlow(input);
}

const optimizePrompt = ai.definePrompt({
  name: 'optimizePrompt',
  input: { schema: OptimizeInputSchema },
  output: { schema: OptimizeOutputSchema },
  prompt: `You are an expert travel logistics planner for the Boston and Merrimack Valley area.
The user has selected the following activities for their day starting from Tewksbury, MA:
{{#each activities}}
- {{{name}}} ({{{type}}}, {{{durationMinutes}}} mins) located at {{{address}}}
{{/each}}

Plan starts at {{{startHour}}}:00 AM.

Your task:
1. Reorder the activities into the most logical sequence to minimize travel time and respect typical business hours.
2. Insert a 60-minute lunch break at an appropriate time (around 12:00 PM - 1:30 PM).
3. If no 'food' type activities are in the list, suggest a local eating place (e.g., in the North End, Seaport, or Tewksbury).
4. For each item, provide a startTime and duration.
5. Provide a brief reason for the ordering logic.

Return the final optimized schedule.`,
});

const optimizeFlow = ai.defineFlow(
  {
    name: 'optimizeFlow',
    inputSchema: OptimizeInputSchema,
    outputSchema: OptimizeOutputSchema,
  },
  async (input) => {
    const { output } = await optimizePrompt(input);
    return output!;
  }
);