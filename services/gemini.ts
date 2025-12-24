
import { GoogleGenAI, Type } from "@google/genai";
import { SurveyResponse, Question, QuestionType, TagCloudItem } from "../types";

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

  const textFeedback: string[] = [];
  
  responses.forEach(r => {
      Object.entries(r.answers).forEach(([qId, value]) => {
          const q = questions.find(qu => qu.id === qId);
          if (q) {
              if (q.type === QuestionType.TEXT && typeof value === 'string' && value.trim().length > 0) {
                  textFeedback.push(`Score: ${r.answers['d1'] || 'N/A'}, Comment: "${value}"`);
              }
              if (q.type === QuestionType.MULTIPLE_CHOICE && Array.isArray(value) && value.length > 0) {
                   textFeedback.push(`Dissatisfaction reason: ${value.join(', ')}`);
              }
          }
      });
  });

  const prompt = `
    Analyze the following restaurant customer feedback.
    Focus on extracting common reasons for dissatisfaction (especially for scores <= 8).
    
    Feedback Data:
    ${textFeedback.slice(-100).join('\n')} 

    Return a JSON object with:
    1. summary: A 2-sentence executive summary.
    2. sentiment: Overall sentiment (positive/neutral/negative).
    3. tags: Top 10 negative/improvement keywords with frequency score (1-100).
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
                },
                required: ['summary', 'sentiment', 'tags']
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
