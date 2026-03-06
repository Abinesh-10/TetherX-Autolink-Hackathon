
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

export const generateExecutiveSummary = async (result: AnalysisResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const statsSummary = {
    fileName: result.fileName,
    rowCount: result.rowCount,
    columnCount: result.columnCount,
    issuesCount: result.issues.length,
    columns: result.columns.map(c => ({
      name: c.name,
      type: c.type,
      missing: c.missingPercentage.toFixed(1) + '%'
    })),
    hypotheses: result.hypotheses.map(h => h.conclusion)
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform an executive analysis of the provided dataset stats. 
      
      STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:
      1. **Overview**: 1-2 sentences on the dataset size and scope.
      2. **Key Findings**: 3 bullet points highlighting the most significant trends or correlations.
      3. **Data Quality**: A brief assessment of the data's reliability based on missing values and issues.
      4. **Strategic Recommendation**: One clear actionable step for a business user.

      Dataset Stats: ${JSON.stringify(statsSummary)}`,
      config: {
        temperature: 0.4,
        systemInstruction: "You are AIDA, a world-class Data Consultant. Use clean Markdown. Avoid flowery language. Use bold headers. Keep it under 200 words."
      }
    });

    return response.text || "Summary unavailable.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
