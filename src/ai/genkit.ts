import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * Using the provided API key for all AI activities.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyCD2fBooXpBz-HrQedAVwaRlJR1ytugCnA'
    })
  ],
});
