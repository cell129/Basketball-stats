import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StatControls } from './components/StatControls';
import PlayerSummary from './components/PlayerSummary';
import GameLog from './components/GameLog';
import GameManager from './components/GameManager';
import { generateGameSummary } from './services/geminiService';
import { generateCsvContent } from './utils/csvExport';
import type { Stats, LogEntry, StatKey, SavedGame } from './types';

const INITIAL_STATS: Stats = {
  FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0,
  OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0,
};

const STORAGE_KEY = 'basketball-stat-tracker-games-v2';

const createNewGame = (): SavedGame => ({
  id: crypto.randomUUID(),
  lastModified: Date.now(),
  playerName: 'Player 1',
  opposition: 'Opponent',
  gameDate: new Date().toISOString().split('T')[0],
  stats: { ...INITIAL_STATS },
  log: [],
  playerPhoto: null,
});

// Placeholder SVG icon for player photo, base64 encoded
const placeholderIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

interface GameData {
  games: Record<string, SavedGame>;
  currentGameId: string | null;
}

const App: React.FC = () => {
  const [gameData, setGameData] = useState<GameData>({ games: {}, currentGameId: null });
  const [isGameManagerOpen, setIsGameManagerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<number | null>(null);

  // Effect to load state from localStorage on initial component mount
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.games && Object.keys(savedState.games).length > 0 && savedState.currentGameId) {
          // Ensure a valid currentGameId is present
          if (!savedState.games[savedState.currentGameId]) {
            savedState.currentGameId = Object.keys(savedState.games)[0];
          }
          setGameData(savedState);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }
    // If nothing loaded, create a new game
    const newGame = createNewGame();
    setGameData({
      games: { [newGame.id]: newGame },
      currentGameId: newGame.id,
    });
  }, []);

  // Effect to save state to localStorage whenever gameData changes
  useEffect(() => {
    if (gameData.currentGameId) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
      } catch (error) {
        console.error("Error saving state to localStorage:", error);
      }
    }
  }, [gameData]);

  // Effect to clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  const currentGame = gameData.currentGameId ? gameData.games[gameData.currentGameId] : null;

  const updateCurrentGame = (updates: Partial<SavedGame>, clearSummary: boolean = false) => {
    if (!gameData.currentGameId) return;
    setGameData(prev => {
      const updatedGame = {
        ...prev.games[prev.currentGameId!],
        ...updates,
        lastModified: Date.now(),
      };
      return {
        ...prev,
        games: {
          ...prev.games,
          [prev.currentGameId!]: updatedGame,
        }
      };
    });
    if (clearSummary) {
      setSummary('');
    }
  };

  const handleStatUpdate = useCallback((actionText: string, statChanges: Partial<Stats>) => {
    if (!currentGame) return;

    const newStats = { ...currentGame.stats };
    for (const key in statChanges) {
      newStats[key as StatKey] += statChanges[key as StatKey]!;
    }
    const newLogEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      actionText,
      statChanges,
    };
    updateCurrentGame({
      stats: newStats,
      log: [newLogEntry, ...currentGame.log],
    }, true);
  }, [currentGame, updateCurrentGame]);

  const handleUndo = useCallback((id: string) => {
    if (!currentGame) return;
    const entryToUndo = currentGame.log.find(entry => entry.id === id);
    if (!entryToUndo) return;

    const newStats = { ...currentGame.stats };
    for (const key in entryToUndo.statChanges) {
      newStats[key as StatKey] -= entryToUndo.statChanges[key as StatKey]!;
    }

    updateCurrentGame({
      stats: newStats,
      log: currentGame.log.filter(entry => entry.id !== id),
    }, true);
  }, [currentGame, updateCurrentGame]);

  const handleReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      resetTimeoutRef.current = window.setTimeout(() => {
        setConfirmingReset(false);
      }, 3000); // Revert after 3 seconds
      return;
    }

    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
    
    // Resets the current game to initial state, keeping ID and photo
    updateCurrentGame({
      stats: { ...INITIAL_STATS },
      log: [],
      playerName: 'Player 1',
      opposition: 'Opponent',
      gameDate: new Date().toISOString().split('T')[0],
    }, true);

    setConfirmingReset(false);
  };
  
  const handleSaveGame = () => {
    if (isSaving || !gameData.currentGameId) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
      setIsSaving(true);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        setIsSaving(false);
      }, 2000);

    } catch (error) {
      console.error("Error manually saving state to localStorage:", error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!currentGame) return;
    setIsGenerating(true);
    setSummary('');
    const { playerName, opposition, gameDate, stats, log } = currentGame;
    const result = await generateGameSummary(playerName, opposition, gameDate, stats, log);
    setSummary(result);
    setIsGenerating(false);
  };

  const handleExport = () => {
    if (!currentGame || currentGame.log.length === 0) {
      alert("No stats to export.");
      return;
    }
    
    const { playerName, opposition, gameDate, stats, log } = currentGame;
    const csvContent = generateCsvContent(playerName, opposition, gameDate, stats, log);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const sanitizedPlayer = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedOpponent = opposition.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedPlayer}_vs_${sanitizedOpponent}_${gameDate}.csv`;

    const link = document.createElement("a");
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handlePhotoUploadClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCurrentGame({ playerPhoto: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      updateCurrentGame({ playerPhoto: null });
  };

  const handleCreateNewGame = () => {
    const newGame = createNewGame();
    setGameData(prev => ({
      games: { ...prev.games, [newGame.id]: newGame },
      currentGameId: newGame.id,
    }));
    setSummary('');
  };

  const handleLoadGame = (id: string) => {
    if (gameData.games[id]) {
      setGameData(prev => ({ ...prev, currentGameId: id }));
      setSummary('');
    }
  };

  const handleDeleteGame = (id: string) => {
    if (Object.keys(gameData.games).length <= 1) {
      alert("You cannot delete the last game. Create a new one first.");
      return;
    }
    setGameData(prev => {
      const newGames = { ...prev.games };
      delete newGames[id];
      const newCurrentId = prev.currentGameId === id ? Object.keys(newGames)[0] : prev.currentGameId;
      return { games: newGames, currentGameId: newCurrentId };
    });
  };

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-white">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <GameManager 
        isOpen={isGameManagerOpen}
        games={Object.values(gameData.games)}
        activeGameId={gameData.currentGameId}
        onLoadGame={handleLoadGame}
        onDeleteGame={handleDeleteGame}
        onCreateNewGame={handleCreateNewGame}
        onClose={() => setIsGameManagerOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
              <div className="w-full sm:w-auto">
                <h1 className="text-3xl font-bold text-white tracking-tight">Basketball Stat Tracker <span className="text-cyan-400">AI</span></h1>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative group flex-shrink-0 self-center">
                      <img
                          src={currentGame.playerPhoto || placeholderIcon}
                          alt="Player photo"
                          className="h-16 w-16 rounded-full object-cover border-2 border-gray-600 group-hover:border-cyan-400 transition-colors bg-gray-700"
                      />
                      <div
                          onClick={handlePhotoUploadClick}
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer transition-opacity"
                          role="button"
                          aria-label="Upload player photo"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                      </div>
                      {currentGame.playerPhoto && (
                          <button
                              onClick={handleRemovePhoto}
                              className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all"
                              aria-label="Remove player photo"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                          </button>
                      )}
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoChange}
                          accept="image/*"
                          className="hidden"
                          aria-hidden="true"
                      />
                  </div>
                  <input
                    type="text"
                    value={currentGame.playerName}
                    onChange={(e) => updateCurrentGame({ playerName: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Player Name"
                    aria-label="Player Name"
                  />
                  <span className="text-gray-500 hidden sm:inline">vs</span>
                  <input
                    type="text"
                    value={currentGame.opposition}
                    onChange={(e) => updateCurrentGame({ opposition: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Opponent"
                    aria-label="Opponent Name"
                  />
                  <input
                    type="date"
                    value={currentGame.gameDate}
                    onChange={(e) => updateCurrentGame({ gameDate: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    aria-label="Game Date"
                  />
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
                 <button
                    onClick={handleSaveGame}
                    disabled={isSaving}
                    className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                        isSaving 
                        ? 'bg-green-600 cursor-not-allowed' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                >
                    {isSaving ? 'Saved!' : 'Save Game'}
                </button>
                <button
                    onClick={() => setIsGameManagerOpen(true)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Manage Games
                </button>
                <button
                    onClick={handleExport}
                    disabled={currentGame.log.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Export CSV
                </button>
                <button
                    onClick={handleReset}
                    className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                      confirmingReset 
                        ? 'bg-yellow-500 hover:bg-yellow-600' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                    {confirmingReset ? 'Confirm Reset' : 'Reset Game'}
                </button>
              </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PlayerSummary stats={currentGame.stats} />
                <StatControls onStatUpdate={handleStatUpdate} />
                <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-white">AI Game Summary</h2>
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isGenerating || currentGame.log.length === 0}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Performance Summary'}
                    </button>
                    {summary && (
                        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                            <p className="whitespace-pre-wrap text-gray-300">{summary}</p>
                        </div>
                    )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <GameLog log={currentGame.log} onUndo={handleUndo} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;