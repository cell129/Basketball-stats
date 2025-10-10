
import React from 'react';
import type { Game } from '../types';
import { calculatePoints } from '../utils/statCalculations';

interface GameHistoryProps {
  games: Game[];
  currentGameId: string | undefined;
  onSelectGame: (game: Game) => void;
  onDeleteGame: (gameId: string) => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ games, currentGameId, onSelectGame, onDeleteGame }) => {
  const pastGames = games.filter(game => game.id !== currentGameId);
    
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg flex flex-col h-full max-h-[calc(100vh-140px)]">
      <h2 className="text-xl font-bold mb-4 text-white flex-shrink-0">Game History</h2>
      {pastGames.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-500">No past games saved.</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-grow pr-2">
          <ul className="space-y-3">
            {pastGames.map((game) => {
                const points = calculatePoints(game.stats);
                return (
                    <li key={game.id} className="bg-gray-700/50 p-3 rounded-md animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-200">vs {game.opposition}</p>
                                <p className="text-sm text-gray-400">{game.gameDate} - <span className="font-bold text-cyan-400">{points} PTS</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onSelectGame(game)}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-md transition-colors"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => onDeleteGame(game.id)}
                                    className="text-xs bg-red-600 hover:red-bg-700 text-white font-semibold p-1 rounded-md transition-colors"
                                    aria-label="Delete game"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    </li>
                );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GameHistory;
