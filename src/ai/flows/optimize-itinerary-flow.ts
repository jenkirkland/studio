'use server';
/**
 * @fileOverview A consolidated Genkit flow that optimizes an entire multi-day trip.
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

const DayInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  activities: z.array(ActivitySchema),
  startLocation: z.string(),
  endLocation: z.string(),
  startHour: z.number().optional(),
  endHour: z.number().optional(),
});

const OptimizeFullTripInputSchema = z.object({
  days: z.array(DayInputSchema),
  wishlist: z.array(ActivitySchema),
  dailyActiveHours: z.number().default(8),
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

const OptimizedDaySchema = z.object({
  id: z.string(),
  activities: z.array(OptimizedItemSchema),
});

const OptimizeFullTripOutputSchema = z.object({
  optimizedDays: z.array(OptimizedDaySchema),
  remainingWishlistIds: z.array(z.string()),
  explanation: z.string().describe('Explain the distribution logic.'),
});

export type OptimizeFullTripInput = z.infer<typeof OptimizeFullTripInputSchema>;
export type OptimizeFullTripOutput = z.infer<typeof OptimizeFullTripOutputSchema>;

export async function optimizeFullTrip(input: OptimizeFullTripInput): Promise<OptimizeFullTripOutput> {
  return optimizeFlow(input);
}

const optimizePrompt = ai.definePrompt({
  name: 'optimizeFullTripPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: OptimizeFullTripInputSchema },
  output: { schema: OptimizeFullTripOutputSchema },
  prompt: `You are an expert travel logistics planner for the Boston/Merrimack Valley area.
Goal: Organize a multi-day trip by distributing wishlist items and sequencing everything.

Wishlist (Unscheduled):
{{#each wishlist}}
- {{{name}}} ({{{durationMinutes}}} mins, {{{type}}}) at {{{address}}}
{{/each}}

Current Days & Constraints:
{{#each days}}
- Day: {{{name}}} ({{{date}}})
  Start: {{{startLocation}}} {{#if startHour}}at {{{startHour}}}:00{{/if}}
  End: {{{endLocation}}} {{#if endHour}}by {{{endHour}}}:00{{/if}}
  Already Scheduled:
  {{#each activities}}
  * {{{name}}} ({{{durationMinutes}}} mins) {{#if fixedStartTime}}[FIXED AT {{{fixedStartTime}}}]{{/if}}
  {{/each}}
{{/each}}

Rules:
1. Max activity time per day: {{{dailyActiveHours}}} hours.
2. Distribute wishlist items into the days where they fit best geographically and temporally.
3. Sequence activities to minimize travel.
4. Respect FIXED times exactly.
5. Insert 60-min Lunch gaps around noon if a day has enough activities.
6. Calculate travel time from the previous location.
7. If an item doesn't fit anywhere, keep its ID in remainingWishlistIds.`,
});

const optimizeFlow = ai.defineFlow(
  {
    name: 'optimizeFullTripFlow',
    inputSchema: OptimizeFullTripInputSchema,
    outputSchema: OptimizeFullTripOutputSchema,
  },
  async (input) => {
    const { output } = await optimizePrompt(input);
    return output!;
  }
);
