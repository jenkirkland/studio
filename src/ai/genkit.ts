import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * Upgraded to Pro model for higher rate limits and reasoning capabilities.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-pro',
});
