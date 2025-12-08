import { GoogleGenAI, Type } from "@google/genai";
import { SurveyResponse, Question, QuestionType, TagCloudItem } from "../types";

// Note: In a real production app, you shouldn't expose API keys in frontend code.
// Since this is a demo running in a browser environment, we rely on the env var.
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
}

export const analyzeFeedback = async (
  responses: SurveyResponse[],
  questions: Question[]
): Promise<{ summary: string; sentiment: 'positive' | 'neutral' | 'negative'; tags: TagCloudItem[] }> => {
  
  if (responses.length === 0) {
    return { summary: "No data available.", sentiment: "neutral", tags: [] };
  }

  // Filter text responses and low-score reasons
  const textFeedback: string[] = [];
  
  responses.forEach(r => {
      Object.entries(r.answers).forEach(([qId, value]) => {
          const q = questions.find(qu => qu.id === qId);
          if (q) {
              if (q.type === QuestionType.TEXT && typeof value === 'string' && value.trim().length > 0) {
                  textFeedback.push(`Customer said: "${value}"`);
              }
              if (q.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(value) && value.length > 0) {
                   textFeedback.push(`Customer complained about: ${value.join(', ')}`);
              }
          }
      });
  });

  const prompt = `
    Analyze the following restaurant customer feedback and satisfaction survey data.
    
    Feedback Items:
    ${textFeedback.slice(0, 50).join('\n')} 
    (Truncated to last 50 for brevity)

    Please provide:
    1. A short executive summary (max 2 sentences) of the main issues.
    2. The overall sentiment.
    3. A list of key "negative/improvement" keywords/tags with a frequency score (1-10) for a word cloud.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                    tags: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                value: { type: Type.INTEGER }
                            }
                        }
                    }
                }
            }
        }
    });

    const json = JSON.parse(response.text || '{}');
    return {
        summary: json.summary || "Analysis failed.",
        sentiment: json.sentiment || "neutral",
        tags: json.tags || []
    };

  } catch (error) {
    console.error("Gemini analysis failed", error);
    return {
        summary: "Could not perform AI analysis at this time.",
        sentiment: "neutral",
        tags: []
    };
  }
};