import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * Note: Ensure GOOGLE_GENAI_API_KEY is set in your environment variables.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
