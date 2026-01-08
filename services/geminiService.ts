
import { GoogleGenAI, Type } from "@google/genai";
import { RiskLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSMSTraffic = async (
  smsText: string, 
  deviceContext: { imsiMatch: boolean, simSwapHours: number, isAadhaarVerified: boolean }
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this SMS for fraud detection.
        SMS Content: "${smsText}"
        Device Context:
        - IMSI Match with Registered Device: ${deviceContext.imsiMatch}
        - Time since last SIM swap: ${deviceContext.simSwapHours} hours
        - Aadhaar Verified Identity: ${deviceContext.isAadhaarVerified}
        
        CRITICAL LOGIC: 
        1. If simSwapHours < 72, elevate risk significantly.
        2. If isAadhaarVerified is FALSE, add a "Lack of Identity Trust" penalty to the risk score.
        3. If BOTH are suspicious, mark as CRITICAL.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
            riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
            reasoning: { type: Type.STRING, description: "Short explanation including Aadhaar context" },
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
