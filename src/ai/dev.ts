import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-complementary-activities-flow.ts';
import '@/ai/flows/optimize-itinerary-flow.ts';
import '@/ai/flows/suggest-nearby-food-flow.ts';
import '@/ai/flows/refine-itinerary-chat-flow.ts';
import '@/ai/flows/search-custom-event-flow.ts';
