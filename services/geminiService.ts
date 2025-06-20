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

export const simulateGlobalSearch = async (searchQuery: string): Promise<SearchResultItem[] | null> => {
  if (!ai) {
    console.warn("Gemini AI client not initialized. Cannot simulate search.");
    return null;
  }
  if (!searchQuery.trim()) {
    return [];
  }

  const prompt = `You are a search engine for a cricket application called 'Bat 'n' Ball'.
Given the search query: "${searchQuery}", generate 3 to 5 example search results.
The results can be players, teams, matches, or tournaments.
For each result, provide a 'title' (e.g., player name, team name, match description), a brief 'description' (1-2 sentences), and a 'type' (must be one of: "Player", "Team", "Match", "Tournament", or "Other").
Return the response as a valid JSON array of objects, where each object has 'title', 'description', and 'type' keys.

Example for query "Rohit":
[
  {
    "title": "Rohit Sharma",
    "description": "Current captain of the Indian national cricket team in all formats.",
    "type": "Player"
  },
  {
    "title": "Rohit Memorial Tournament",
    "description": "Annual U19 cricket tournament held in Mumbai.",
    "type": "Tournament"
  }
]

Example for query "final match schedule":
[
  {
    "title": "T20 World Cup Final: India vs Australia",
    "description": "The final match is scheduled for November 19th at Melbourne Cricket Ground.",
    "type": "Match"
  },
  {
    "title": "Local League Final Postponed",
    "description": "The final of the City Championship has been postponed due to rain.",
    "type": "Match"
  }
]

Do not include any explanatory text before or after the JSON array.
The JSON array should be the only content in your response.
Ensure the 'type' field is always one of the specified values.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    
    if (Array.isArray(parsedData) && parsedData.every(item => 
        typeof item.title === 'string' && 
        typeof item.description === 'string' && 
        typeof item.type === 'string' &&
        ["Player", "Team", "Match", "Tournament", "Other"].includes(item.type)
    )) {
        return parsedData as SearchResultItem[];
    } else {
        console.error("Gemini search simulation: Unexpected JSON structure or invalid type field", parsedData);
        // Fallback or attempt to coerce if types are slightly off but structure is array of objects
        if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData.every(item => item.title && item.description)) {
            return parsedData.map(item => ({
                ...item,
                type: ["Player", "Team", "Match", "Tournament", "Other"].includes(item.type) ? item.type : "Other"
            })) as SearchResultItem[];
        }
        return null;
    }

  } catch (error) {
    console.error("Error simulating search with Gemini:", error);
    // Attempt to parse error if it's a known Gemini issue or return a generic message
    let errorMessage = "Failed to fetch search results due to an API error.";
    if (error instanceof Error) {
        errorMessage = `API Error: ${error.message}`;
    }
    // You could return a structured error or specific SearchResultItem indicating failure
    // For now, null signifies a critical failure to get parsable/valid results.
    return null; 
  }
};
