
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BallEvent, GeneratedCommentary } from '../types';

// Ensure API_KEY is available in the environment.
// The user MUST NOT be prompted for this. It's assumed to be pre-configured.
// In a real CRA/Vite app, this would be process.env.REACT_APP_GEMINI_API_KEY or process.env.VITE_GEMINI_API_KEY
// For this environment, we directly use process.env.API_KEY as per instructions.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API Key not found in environment variables (process.env.API_KEY). Gemini features will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateCommentaryForBall = async (ballEvent: BallEvent): Promise<GeneratedCommentary | null> => {
  if (!ai) {
    console.warn("Gemini AI client not initialized. Cannot generate commentary.");
    return { ballByBall: "Automated commentary unavailable." };
  }

  const { runs, isWicket, extraType, batsman, bowler } = ballEvent;
  
  let eventDescription = `${batsman.name} facing ${bowler.name}. `;
  if (isWicket) {
    eventDescription += `WICKET! ${batsman.name} is out.`;
    // TODO: Add wicket type if available
  } else {
    eventDescription += `${batsman.name} scores ${runs} run(s).`;
  }
  if (extraType) {
    eventDescription += ` (${extraType})`;
  }

  const prompt = `
    You are a cricket commentator for a local T20 match.
    Describe the following event in an exciting and engaging way, suitable for a live feed. Keep it brief (1-2 sentences).
    Event: ${eventDescription}
    Focus on the key action and its impact.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Correct model name
      contents: prompt,
      // For low latency if needed: config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    
    const text = response.text.trim();
    return { ballByBall: text };

  } catch (error) {
    console.error("Error generating commentary with Gemini:", error);
    // Provide a fallback or indicate an error
    return { ballByBall: `(Automated commentary generation failed: ${eventDescription})` };
  }
};


export const getFunFactAboutCricket = async (): Promise<string> => {
  if (!ai) {
    return "Gemini AI not available. Did you know cricket is played in over 100 countries?";
  }
  const prompt = "Tell me a fun, short, and interesting fact about the sport of cricket.";
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching fun fact from Gemini:", error);
    return "Could not fetch a fun fact at this time. But cricket is fun!";
  }
};
