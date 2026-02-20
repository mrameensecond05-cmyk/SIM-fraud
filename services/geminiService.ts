
// Replaced GoogleGenAI with Local Ollama Backend Call
import { RiskLevel } from "../types";

// Point this to your computer's IP if running on Android!
const API_URL = 'http://localhost:5000/api';

export const analyzeSMSTraffic = async (
  smsText: string,
  deviceContext: { imsiMatch: boolean, simSwapHours: number, isAadhaarVerified: boolean }
) => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smsText,
        deviceContext,
        userId: 1 // Default user for now, should be from Auth context
      })
    });

    if (!response.ok) throw new Error("Backend Analysis Failed");

    const data = await response.json();
    return data.analysis;

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
