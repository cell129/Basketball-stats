
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Stats, LogEntry, Game } from '../types';
import { calculatePoints, calculatePercentage } from '../utils/statCalculations';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const formatStatsForPrompt = (stats: Stats): string => {
  const points = calculatePoints(stats);
  const totalRebounds = stats.OREB + stats.DREB;
  const fgPercent = calculatePercentage(stats.FGM, stats.FGA);
  const tpPercent = calculatePercentage(stats.TPM, stats.TPA);
  const ftPercent = calculatePercentage(stats.FTM, stats.FTA);

  return `
- Points: ${points}
- Rebounds: ${totalRebounds} (${stats.OREB} OREB, ${stats.DREB} DREB)
- Assists: ${stats.AST}
- Steals: ${stats.STL}
- Blocks: ${stats.BLK}
- Turnovers: ${stats.TOV}
- Fouls: ${stats.PF}
- Field Goals: ${stats.FGM}/${stats.FGA} (${fgPercent})
- 3-Pointers: ${stats.TPM}/${stats.TPA} (${tpPercent})
- Free Throws: ${stats.FTM}/${stats.FTA} (${ftPercent})
  `.trim();
};

const formatLogForPrompt = (log: LogEntry[]): string => {
    return log.map(entry => `- ${entry.timestamp}: ${entry.actionText}`).join('\n');
}

export const generateGameSummary = async (playerName: string, game: Pick<Game, 'opposition' | 'gameDate' | 'stats' | 'log' | 'playerTeamScore' | 'oppositionTeamScore'>): Promise<AsyncIterable<GenerateContentResponse>> => {
  const { opposition, gameDate, stats, log, playerTeamScore, oppositionTeamScore } = game;
  const statsSummary = formatStatsForPrompt(stats);
  const logSummary = formatLogForPrompt(log.slice(-30)); // Use last 30 events to keep prompt size reasonable

  let scoreSummary = '';
  if (playerTeamScore !== null && oppositionTeamScore !== null) {
      const result = playerTeamScore > oppositionTeamScore ? 'won' : (playerTeamScore < oppositionTeamScore ? 'lost' : 'tied');
      scoreSummary = `The final score was ${playerTeamScore} to ${oppositionTeamScore}, and their team ${result}.`;
  }

  const prompt = `
You're an energetic and super positive basketball commentator, like someone from a fun sports highlight show. Your job is to give a hype-filled and motivating summary for a player named ${playerName} after their game against ${opposition} on ${gameDate}.
${scoreSummary}

The audience is the player, who is in middle school, so keep the tone fun, exciting, and easy to understand. Use exclamation points and encouraging words!

Look at their final stats and the recent plays from the game log.
- Celebrate the awesome things they did! What were their biggest highlights?
- Point out their hustle and smart plays.
- Gently suggest one or two things they can practice to become an even more unstoppable force on the court next time. Frame it as a fun challenge!

Keep it concise, positive, and full of energy! No more than 150 words!

**Here are the stats:**
${statsSummary}

**Recent Action from the Game:**
${logSummary}

**Hype Summary:**
`.trim();

  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7, // Increased for more creative/fun responses
            topP: 0.95,
        }
    });
    return response;
  } catch (error) {
    console.error("Error generating game summary:", error);
    throw new Error("There was an error generating the game summary. Please check your API key and network connection.");
  }
};
