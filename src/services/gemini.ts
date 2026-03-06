import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIAnalysisResult {
  sentiment: "positive" | "neutral" | "negative";
  emotions: {
    sadness: number;
    anger: number;
    fear: number;
    joy: number;
  };
  psychologicalProfile: {
    anxietyIndicator: number;
    depressionIndicator: number;
    emotionalInstability: number;
    cognitiveDistortions: string[];
    stressMarkers: string[];
  };
  riskScore: number;
  summary: string;
}

export async function analyzePatientInput(text: string): Promise<AIAnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following patient journal entry/message for mental health risk assessment. 
    Provide a detailed analysis including sentiment, emotion scores (0-1), psychological indicators (0-1), 
    cognitive distortions, linguistic stress markers, a final risk score (0-100), and a brief summary.
    
    Patient Input: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
          emotions: {
            type: Type.OBJECT,
            properties: {
              sadness: { type: Type.NUMBER },
              anger: { type: Type.NUMBER },
              fear: { type: Type.NUMBER },
              joy: { type: Type.NUMBER }
            },
            required: ["sadness", "anger", "fear", "joy"]
          },
          psychologicalProfile: {
            type: Type.OBJECT,
            properties: {
              anxietyIndicator: { type: Type.NUMBER },
              depressionIndicator: { type: Type.NUMBER },
              emotionalInstability: { type: Type.NUMBER },
              cognitiveDistortions: { type: Type.ARRAY, items: { type: Type.STRING } },
              stressMarkers: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["anxietyIndicator", "depressionIndicator", "emotionalInstability", "cognitiveDistortions", "stressMarkers"]
          },
          riskScore: { type: Type.NUMBER },
          summary: { type: Type.STRING }
        },
        required: ["sentiment", "emotions", "psychologicalProfile", "riskScore", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
