import {genkit} from 'genkit';
import {googleAI as googleAIPlugin} from '@genkit-ai/google-genai';

const getAiInstance = () => {
  if (process.env.NODE_ENV !== 'production' && !process.env.GEMINI_API_KEY) {
    console.warn(
      'GEMINI_API_KEY not found. Genkit AI features will be disabled. To enable, add GEMINI_API_KEY to your .env.local file.'
    );

    const disabledFlow = async () => {
      throw new Error(
        'AI features are disabled. Please configure your Gemini API key in the .env.local file.'
      );
    };

    const disabledAi = new Proxy(
      {},
      {
        get(target, prop) {
          if (String(prop).startsWith('define')) {
            return () => disabledFlow;
          }
          return disabledFlow;
        },
      }
     ) as ReturnType<typeof genkit>;

    return {
      ai: disabledAi,
      googleAI: (() => ({
        name: 'google-ai-disabled',
        __plugin: 'google-ai-disabled',
      })) as unknown as ReturnType<typeof googleAIPlugin>,
    };
  }

  const googleAI = googleAIPlugin();
  const ai = genkit({
    plugins: [googleAI],
    model: 'googleai/gemini-2.5-flash',
  });

  return { ai, googleAI };
};

export const { ai, googleAI } = getAiInstance();
