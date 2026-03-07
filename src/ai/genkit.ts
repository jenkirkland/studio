import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * We use the provided API key explicitly to ensure the higher-tier limits are respected.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyCD2fBooXpBz-HrQedAVwaRlJR1ytugCnA'
    })
  ],
});
