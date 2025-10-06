import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StatControls } from './components/StatControls';
import PlayerSummary from './components/PlayerSummary';
import GameLog from './components/GameLog';
import { generateGameSummary } from './services/geminiService';
import { generateCsvContent } from './utils/csvExport';
import type { Stats, LogEntry, StatKey } from './types';

const INITIAL_STATS: Stats = {
  FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0,
  OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0,
};

const STORAGE_KEY = 'basketball-stat-tracker-state';

// Placeholder SVG icon for player photo, base64 encoded
const placeholderIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const App: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [opposition, setOpposition] = useState<string>('Opponent');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [playerPhoto, setPlayerPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const resetTimeoutRef = useRef<number | null>(null);

  // Effect to load state from localStorage on initial component mount
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState) {
          setPlayerName(savedState.playerName || 'Player 1');
          setOpposition(savedState.opposition || 'Opponent');
          setGameDate(savedState.gameDate || new Date().toISOString().split('T')[0]);
          setStats(savedState.stats || INITIAL_STATS);
          setLog(savedState.log || []);
          setPlayerPhoto(savedState.playerPhoto || null);
        }
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const gameState = {
        playerName,
        opposition,
        gameDate,
        stats,
        log,
        playerPhoto,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }, [playerName, opposition, gameDate, stats, log, playerPhoto]);

  // Effect to clear reset confirmation timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);


  const handleStatUpdate = useCallback((actionText: string, statChanges: Partial<Stats>) => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      for (const key in statChanges) {
        newStats[key as StatKey] += statChanges[key as StatKey]!;
      }
      return newStats;
    });

    const newLogEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      actionText,
      statChanges,
    };

    setLog(prevLog => [newLogEntry, ...prevLog]);
  }, []);

  const handleUndo = useCallback((id: string) => {
    const entryToUndo = log.find(entry => entry.id === id);
    if (!entryToUndo) return;

    setStats(prevStats => {
      const newStats = { ...prevStats };
      for (const key in entryToUndo.statChanges) {
        newStats[key as StatKey] -= entryToUndo.statChanges[key as StatKey]!;
      }
      return newStats;
    });

    setLog(prevLog => prevLog.filter(entry => entry.id !== id));
  }, [log]);

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

    setStats(INITIAL_STATS);
    setLog([]);
    setSummary('');
    setPlayerName('Player 1');
    setOpposition('Opponent');
    setGameDate(new Date().toISOString().split('T')[0]);
    setPlayerPhoto(null);
    setConfirmingReset(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing state from localStorage:", error);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setSummary('');
    const result = await generateGameSummary(playerName, opposition, gameDate, stats, log);
    setSummary(result);
    setIsGenerating(false);
  };

  const handleExport = () => {
    if (log.length === 0) {
      alert("No stats to export.");
      return;
    }

    const csvContent = generateCsvContent(playerName, opposition, gameDate, stats, log);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Sanitize names for filename
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

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPlayerPhoto(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl font-bold text-white tracking-tight">Basketball Stat Tracker <span className="text-cyan-400">AI</span></h1>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative group flex-shrink-0 self-center">
                  <img
                      src={playerPhoto || placeholderIcon}
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
                  {playerPhoto && (
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
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Player Name"
                aria-label="Player Name"
              />
               <span className="text-gray-500 hidden sm:inline">vs</span>
               <input
                type="text"
                value={opposition}
                onChange={(e) => setOpposition(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="Opponent"
                aria-label="Opponent Name"
              />
               <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                aria-label="Game Date"
              />
            </div>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
            <button
                onClick={handleExport}
                disabled={log.length === 0}
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
            <PlayerSummary stats={stats} />
            <StatControls onStatUpdate={handleStatUpdate} />
             <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">AI Game Summary</h2>
                <button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating || log.length === 0}
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
            <GameLog log={log} onUndo={handleUndo} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
