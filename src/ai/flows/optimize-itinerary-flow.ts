'use server';
/**
 * @fileOverview A consolidated Genkit flow that optimizes trip itineraries.
 * Includes both full-trip distribution and single-day sequencing.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

const OptimizeItineraryInputSchema = z.object({
  activities: z.array(ActivitySchema),
  startHour: z.number().default(9),
  endHour: z.number().optional(),
  startLocation: z.string(),
  endLocation: z.string(),
});

const OptimizeItineraryOutputSchema = z.object({
  itinerary: z.array(OptimizedItemSchema),
});

export type OptimizeFullTripOutput = z.infer<typeof OptimizeFullTripOutputSchema>;
export type OptimizeFullTripResponse = { success: true; data: OptimizeFullTripOutput } | { success: false; error: string };
export type OptimizeItineraryInput = z.infer<typeof OptimizeItineraryInputSchema>;
export type OptimizeItineraryOutput = z.infer<typeof OptimizeItineraryOutputSchema>;
export type OptimizeItineraryResponse = { success: true; data: OptimizeItineraryOutput } | { success: false; error: string };
/**
 * Optimizes an entire multi-day trip by distributing wishlist items and sequencing everything.
 */
export async function optimizeFullTrip(input: OptimizeFullTripInput): Promise<OptimizeFullTripResponse> {
  try {
    const data = await optimizeFullTripFlow(input);
    return { success: true, data };
  } catch (error: any) {
    console.error("Genkit Flow Error:", error);
    return { success: false, error: error?.message || "An unknown AI error occurred." };
  }
}

/**
 * Optimizes a single day's sequence of activities.
 */
export async function optimizeItinerary(input: OptimizeItineraryInput): Promise<OptimizeItineraryResponse> {
  try {
    const data = await optimizeItineraryFlow(input);
    return { success: true, data };
  } catch (error: any) {
    console.error("Genkit Flow Error:", error);
    return { success: false, error: error?.message || "An unknown AI error occurred." };
  }
}

const fullTripPrompt = ai.definePrompt({
  name: 'optimizeFullTripPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: OptimizeFullTripInputSchema },
  output: { schema: OptimizeFullTripOutputSchema },
  prompt: `You are an expert travel logistics planner for the Boston/Merrimack Valley area.
Goal: Organize a multi-day trip by distributing wishlist items and sequencing everything.

Wishlist (Unscheduled):
{{#each wishlist}}
- ID: {{{id}}} | {{{name}}} ({{{durationMinutes}}} mins, {{{type}}}) at {{{address}}}
{{/each}}

Current Days & Constraints:
{{#each days}}
- Day ID: {{{id}}} | {{{name}}} ({{{date}}})
  Start: {{{startLocation}}} {{#if startHour}}at {{{startHour}}}:00{{/if}}
  End: {{{endLocation}}} {{#if endHour}}by {{{endHour}}}:00{{/if}}
  Already Scheduled:
  {{#each activities}}
  * ID: {{{id}}} | {{{name}}} ({{{durationMinutes}}} mins) {{#if fixedStartTime}}[FIXED AT {{{fixedStartTime}}}]{{/if}}
  {{/each}}
{{/each}}

Rules:
1. Max activity time per day: {{{dailyActiveHours}}} hours.
2. Distribute wishlist items into the days where they fit best geographically and temporally.
3. Sequence activities to minimize travel.
4. Respect FIXED times exactly.
5. Insert 60-min Lunch gaps around noon if a day has enough activities.
6. Calculate travel time from the previous location.
7. If an item doesn't fit anywhere, keep its ID in remainingWishlistIds.
8. IMPORTANT: You MUST use the exact Day ID and Activity ID provided in the output JSON. Never make up your own IDs.`,
});

const singleDayPrompt = ai.definePrompt({
  name: 'optimizeItineraryPrompt',
  model: 'googleai/gemini-3-flash-preview',
  input: { schema: OptimizeItineraryInputSchema },
  output: { schema: OptimizeItineraryOutputSchema },
  prompt: `You are an expert travel logistics planner. Sequence these activities for a single day.
Start Location: {{{startLocation}}} at {{{startHour}}}:00
End Location: {{{endLocation}}} {{#if endHour}}by {{{endHour}}}:00{{/if}}

Activities:
{{#each activities}}
- ID: {{{id}}} | {{{name}}} ({{{durationMinutes}}} mins) {{#if fixedStartTime}}[FIXED AT {{{fixedStartTime}}}]{{/if}} at {{{address}}}
{{/each}}

Rules:
1. Sequence to minimize travel time.
2. Respect FIXED times exactly.
3. Insert 60-min Lunch gap around noon if there is time.
4. Calculate travel time from previous location.
5. IMPORTANT: You MUST use the exact Activity ID provided in the output JSON. Never make up your own IDs.`,
});

const optimizeFullTripFlow = ai.defineFlow(
  {
    name: 'optimizeFullTripFlow',
    inputSchema: OptimizeFullTripInputSchema,
    outputSchema: OptimizeFullTripOutputSchema,
  },
  async (input) => {
    const { output } = await fullTripPrompt(input);
    return output!;
  }
);

const optimizeItineraryFlow = ai.defineFlow(
  {
    name: 'optimizeItineraryFlow',
    inputSchema: OptimizeItineraryInputSchema,
    outputSchema: OptimizeItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await singleDayPrompt(input);
    return output!;
  }
);
