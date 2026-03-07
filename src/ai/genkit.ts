import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * Using the provided API key and the Pro model for high-tier performance.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyCD2fBooXpBz-HrQedAVwaRlJR1ytugCnA'
    })
  ],
  model: 'googleai/gemini-1.5-pro',
});
