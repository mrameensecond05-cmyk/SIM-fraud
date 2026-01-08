
import { GoogleGenAI, Type } from "@google/genai";
import { RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSMSTraffic = async (smsText: string, deviceContext: { imsiMatch: boolean, simSwapHours: number }) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this SMS for fraud detection.
        SMS Content: "${smsText}"
        Device Context:
        - IMSI Match with Registered Device: ${deviceContext.imsiMatch}
        - Time since last SIM swap: ${deviceContext.simSwapHours} hours
        
        Evaluate phishing, social engineering, and potential unauthorized transaction requests.
        Crucial: If simSwapHours < 72, the risk is automatically elevated.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
            riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
            reasoning: { type: Type.STRING, description: "Short explanation for the user" },
            category: { type: Type.STRING, description: "Phishing, Transaction, Social Engineering, or Normal" }
          },
          required: ["riskScore", "riskLevel", "reasoning", "category"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      riskScore: 0,
      riskLevel: RiskLevel.LOW,
      reasoning: "Analysis unavailable. Local heuristics suggest safe.",
      category: "Unknown"
    };
  }
};
