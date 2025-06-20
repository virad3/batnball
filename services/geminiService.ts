
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BallEvent, GeneratedCommentary, SearchResultItem } from '../types';

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

  const { runs, isWicket, extraType, wicketType } = ballEvent; // Removed batsman, bowler
  
  let eventDescription = "";
  if (isWicket) {
    eventDescription += `WICKET!`;
    if (wicketType) {
        eventDescription += ` Type: ${wicketType}.`;
    } else {
        eventDescription += ` A batsman is out.`;
    }
  } else {
    eventDescription += `Scored ${runs} run(s).`;
  }
  if (extraType) {
    eventDescription += ` (${extraType})`;
  }

  const prompt = `
    You are a cricket commentator for a local T20 match.
    Describe the following event in an exciting and engaging way, suitable for a live feed. Keep it brief (1-2 sentences).
    Event: A ball was bowled. Result: ${eventDescription}
    Focus on the key action and its impact. Be generic if player names are not available.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      // For low latency if needed: config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    
    const text = response.text.trim();
    return { ballByBall: text };

  } catch (error) {
    console.error("Error generating commentary with Gemini:", error);
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

// simulateGlobalSearch function has been removed as per user request.
// If other search functionalities using Gemini are needed in the future, they can be added here.
