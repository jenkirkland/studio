import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * Using the latest Gemini 3 Flash Preview for high-speed, high-quality reasoning.
 * It uses the GEMINI_API_KEY from environment variables for local/production stability.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCD2fBooXpBz-HrQedAVwaRlJR1ytugCnA'
    })
  ],
  model: 'googleai/gemini-3-flash-preview',
});
