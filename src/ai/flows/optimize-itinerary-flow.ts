'use server';
/**
 * @fileOverview A Genkit flow that optimizes activities for a day, respecting arrival/departure times.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  durationMinutes: z.number(),
  type: z.string(),
  address: z.string(),
  fixedStartTime: z.string().optional().describe('Format: HH:MM AM/PM'),
});

const OptimizeInputSchema = z.object({
  activities: z.array(ActivitySchema),
  startHour: z.number().default(9),
  endHour: z.number().optional().describe('The hour the day must end by (e.g., departure time).'),
});

const OptimizedItemSchema = z.object({
  type: z.enum(['activity', 'meal']),
  id: z.string().optional(),
  name: z.string(),
  startTime: z.string().describe('Format: HH:MM AM/PM'),
  endTime: z.string().describe('Format: HH:MM AM/PM'),
  durationMinutes: z.number(),
  travelTimeMinutes: z.number(),
  reason: z.string().optional(),
  isFixed: z.boolean().optional(),
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
  prompt: `You are an expert travel logistics planner.
The user is planning a day starting from Tewksbury, MA.

Available hours for this day: 
Start: {{{startHour}}}:00
{{#if endHour}}End: {{{endHour}}}:00 (strictly no activities after this time){{/if}}

Activities to schedule:
{{#each activities}}
- {{{name}}} ({{{durationMinutes}}} mins) {{#if fixedStartTime}}[FIXED AT {{{fixedStartTime}}}]{{/if}}
{{/each}}

Rules:
1. Reorder activities to minimize travel time.
2. Respect FIXED times exactly.
3. If endHour is provided, ensure the "Return to Tewksbury" finishes before endHour.
4. Insert a 60-min lunch if there's a gap around noon.
5. Always include "Return to Tewksbury" at the end.`,
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
