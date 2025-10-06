import React, { useState, useEffect } from 'react';
import type { SavedGame } from '../types';

interface GameManagerProps {
  isOpen: boolean;
  games: SavedGame[];
  activeGameId: string | null;
  onLoadGame: (id: string) => void;
  onDeleteGame: (id: string) => void;
  onCreateNewGame: () => void;
  onClose: () => void;
}

const GameManager: React.FC<GameManagerProps> = ({
  isOpen,
  games,
  activeGameId,
  onLoadGame,
  onDeleteGame,
  onCreateNewGame,
  onClose,
}) => {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const deleteTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteClick = (gameId: string) => {
    if (confirmingDeleteId === gameId) {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      onDeleteGame(gameId);
      setConfirmingDeleteId(null);
    } else {
      setConfirmingDeleteId(gameId);
      deleteTimeoutRef.current = window.setTimeout(() => {
        setConfirmingDeleteId(null);
      }, 3000);
    }
  };


  const sortedGames = [...games].sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className={`flex-shrink-0 bg-gray-800 border-r border-gray-700/50 h-full flex flex-col shadow-2xl transition-all duration-300 ease-in-out ${isOpen ? 'w-96' : 'w-0'} overflow-hidden`}>
        <div className="flex flex-col h-full w-96">
            <header className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-2xl font-bold text-white">Manage Games</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="p-6 flex-shrink-0">
                <button
                    onClick={onCreateNewGame}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                    + Create New Game
                </button>
            </div>

            <div className="px-6 pb-6 overflow-y-auto flex-grow">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Saved Games</h3>
                {sortedGames.length > 0 ? (
                    <ul className="space-y-3">
                    {sortedGames.map((game) => (
                        <li
                        key={game.id}
                        className={`flex flex-col justify-between items-start p-4 rounded-lg transition-colors ${
                            game.id === activeGameId ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-gray-700/50 hover:bg-gray-700'
                        }`}
                        >
                        <div className="mb-3 w-full">
                            <p className="font-bold text-white truncate">{game.playerName} vs {game.opposition}</p>
                            <p className="text-sm text-gray-400">
                            {game.gameDate}
                            </p>
                        </div>
                        <div className="flex gap-2 self-end">
                            <button
                            onClick={() => onLoadGame(game.id)}
                            disabled={game.id === activeGameId}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors"
                            >
                            Select
                            </button>
                            <button
                            onClick={() => handleDeleteClick(game.id)}
                             className={`text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors ${
                                confirmingDeleteId === game.id 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                            >
                            {confirmingDeleteId === game.id ? 'Confirm?' : 'Delete'}
                            </button>
                        </div>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">No saved games found.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default GameManager;
