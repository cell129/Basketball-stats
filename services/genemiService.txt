import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Stats, LogEntry, Game } from '../types';
import { calculatePoints, calculatePercentage } from '../utils/statCalculations';

// Constants for better maintainability
const CONFIG = {
  MAX_LOG_ENTRIES: 30,
  MIN_LOG_ENTRIES: 5,
  TEMPERATURE: 0.7,
  TOP_P: 0.95,
  MAX_OUTPUT_TOKENS: 600,
} as const;

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Sanitizes user input to prevent prompt injection
 */
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim()
    .slice(0, 200); // Reasonable length limit
};

/**
 * Validates required game data
 */
const validateGameData = (
  playerName: string,
  game: Pick<Game, 'opposition' | 'gameDate' | 'stats' | 'log'>
): void => {
  if (!playerName?.trim()) {
    throw new Error("Player name is required");
  }
  
  if (!game.opposition?.trim()) {
    throw new Error("Opposition team is required");
  }
  
  if (!game.gameDate?.trim()) {
    throw new Error("Game date is required");
  }
  
  if (!game.stats) {
    throw new Error("Game stats are required");
  }
  
  if (!Array.isArray(game.log)) {
    throw new Error("Game log must be an array");
  }
};

/**
 * Formats stats with proper fallbacks and readability
 */
const formatStatsForPrompt = (stats: Stats): string => {
  const points = calculatePoints(stats);
  const totalRebounds = (stats.OREB || 0) + (stats.DREB || 0);
  const fgPercent = calculatePercentage(stats.FGM, stats.FGA);
  const tpPercent = calculatePercentage(stats.TPM, stats.TPA);
  const ftPercent = calculatePercentage(stats.FTM, stats.FTA);

  return `
- Points: ${points}
- Rebounds: ${totalRebounds} (${stats.OREB || 0} offensive, ${stats.DREB || 0} defensive)
- Assists: ${stats.AST || 0}
- Steals: ${stats.STL || 0}
- Blocks: ${stats.BLK || 0}
- Turnovers: ${stats.TOV || 0}
- Fouls: ${stats.PF || 0}
- Field Goals: ${stats.FGM || 0}/${stats.FGA || 0} (${fgPercent})
- 3-Pointers: ${stats.TPM || 0}/${stats.TPA || 0} (${tpPercent})
- Free Throws: ${stats.FTM || 0}/${stats.FTA || 0} (${ftPercent})
  `.trim();
};

/**
 * Formats game log with intelligent selection
 */
const formatLogForPrompt = (log: LogEntry[]): string => {
  if (!log.length) {
    return "No detailed play-by-play available for this game.";
  }

  // Take the most recent entries, but ensure we have meaningful content
  const recentLog = log.slice(-CONFIG.MAX_LOG_ENTRIES);
  
  if (recentLog.length < CONFIG.MIN_LOG_ENTRIES) {
    return recentLog.map(entry => 
      `- ${entry.timestamp}: ${sanitizeInput(entry.actionText)}`
    ).join('\n');
  }

  return recentLog.map(entry => 
    `- ${entry.timestamp}: ${sanitizeInput(entry.actionText)}`
  ).join('\n');
};

/**
 * Creates the score summary with proper formatting
 */
const createScoreSummary = (
  playerTeamScore: number | null,
  oppositionTeamScore: number | null
): string => {
  if (playerTeamScore === null || oppositionTeamScore === null) {
    return '';
  }

  const result = 
    playerTeamScore > oppositionTeamScore ? 'won' :
    playerTeamScore < oppositionTeamScore ? 'lost' : 
    'tied';

  return `The final score was ${playerTeamScore}-${oppositionTeamScore}, and their team ${result}!`;
};

/**
 * Builds the AI prompt with all necessary context
 */
const buildPrompt = (
  playerName: string,
  opposition: string,
  gameDate: string,
  scoreSummary: string,
  statsSummary: string,
  logSummary: string
): string => {
  return `
You're an energetic and super positive basketball commentator, like someone from a fun sports highlight show. Your job is to give a hype-filled and motivating summary for a player named ${sanitizeInput(playerName)} after their game against ${sanitizeInput(opposition)} on ${sanitizeInput(gameDate)}.

${scoreSummary}

The audience is the player, who is in middle school, so keep the tone fun, exciting, and easy to understand. Use exclamation points and encouraging words!

Look at their final stats and the recent plays from the game log:
- Celebrate the awesome things they did! What were their biggest highlights?
- Point out their hustle and smart plays.
- Gently suggest one or two things they can practice to become an even more unstoppable force on the court next time. Frame it as a fun challenge!

Keep it concise (around 200-250 words), positive, and full of energy!

**Here are the stats:**
${statsSummary}

**Recent Action from the Game:**
${logSummary}

**Your Hype Summary:**
`.trim();
};

/**
 * Generates an energetic game summary for a player
 * @throws {Error} If validation fails or API call errors
 */
export const generateGameSummary = async (
  playerName: string,
  game: Pick<Game, 'opposition' | 'gameDate' | 'stats' | 'log' | 'playerTeamScore' | 'oppositionTeamScore'>
): Promise<AsyncIterable<GenerateContentResponse>> => {
  // Validate inputs
  validateGameData(playerName, game);

  const { opposition, gameDate, stats, log, playerTeamScore, oppositionTeamScore } = game;

  // Format data for prompt
  const statsSummary = formatStatsForPrompt(stats);
  const logSummary = formatLogForPrompt(log);
  const scoreSummary = createScoreSummary(playerTeamScore, oppositionTeamScore);

  // Build prompt
  const prompt = buildPrompt(
    playerName,
    opposition,
    gameDate,
    scoreSummary,
    statsSummary,
    logSummary
  );

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: CONFIG.TEMPERATURE,
        topP: CONFIG.TOP_P,
        maxOutputTokens: CONFIG.MAX_OUTPUT_TOKENS,
      }
    });

    if (!response) {
      throw new Error("No response received from AI model");
    }

    return response;
  } catch (error) {
    // Provide more specific error context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error generating game summary:", {
      error: errorMessage,
      playerName,
      opposition,
      gameDate
    });

    // Re-throw with user-friendly message
    if (errorMessage.includes('API_KEY') || errorMessage.includes('authentication')) {
      throw new Error("Authentication failed. Please check your API key configuration.");
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      throw new Error("Network error. Please check your internet connection and try again.");
    } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      throw new Error("API quota exceeded. Please try again later.");
    } else {
      throw new Error(`Failed to generate game summary: ${errorMessage}`);
    }
  }
};
