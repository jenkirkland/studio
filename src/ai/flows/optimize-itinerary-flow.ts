'use server';
/**
 * @fileOverview A Genkit flow that optimizes the order of activities for a day trip, including return travel to Tewksbury.
 * Respects fixed-time activities (e.g., tickets, reservations).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  type: z.string(),
  address: z.string(),
  fixedStartTime: z.string().optional().describe('Format: HH:MM AM/PM. If provided, this activity MUST start at exactly this time.'),
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
  endTime: z.string().describe('Format: HH:MM AM/PM'),
  durationMinutes: z.number(),
  travelTimeMinutes: z.number().describe('Estimated travel time from previous location in minutes'),
  reason: z.string().optional(),
  isFixed: z.boolean().optional().describe('Set to true if this was a fixed-time activity'),
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
  prompt: `You are an expert travel logistics planner for the Boston area.
The user has selected the following activities for their day starting from Tewksbury, MA:
{{#each activities}}
- {{{name}}} ({{{type}}}, {{{durationMinutes}}} mins) at {{{address}}} {{#if fixedStartTime}}[FIXED AT {{{fixedStartTime}}}]{{/if}}
{{/each}}

Day starts at {{{startHour}}}:00 AM.

Your task:
1. Reorder activities to minimize travel, BUT you MUST respect all activities with a "fixedStartTime". 
2. If an activity is FIXED at 7:30 PM, it MUST start at exactly 7:30 PM in your schedule. Adjust all other activities and travel times around these fixed points.
3. For each activity, estimate travel time from the previous location (first one is from Tewksbury).
4. Provide startTime and endTime for each item.
5. Insert a 60-minute lunch break if there is a gap around 12:00 PM - 1:30 PM.
6. Suggest a local meal spot if no 'food' activities are in the list.
7. CRITICAL: Always include a final "Return to Tewksbury" activity at the end. 
   - Name: "Return to Tewksbury".
   - durationMinutes: 0.
   - travelTimeMinutes: estimated drive time from the LAST activity back to Tewksbury.
   - startTime: immediately after the last activity ends.

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
