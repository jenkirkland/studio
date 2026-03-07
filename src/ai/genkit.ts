import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for the Boston Merrimack Wanderer app.
 * We initialize without a default model and specify the model explicitly in each prompt
 * to ensure maximum compatibility with the Google AI plugin.
 */
export const ai = genkit({
  plugins: [googleAI()],
});
