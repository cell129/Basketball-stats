import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StatControls } from './components/StatControls';
import PlayerSummary from './components/PlayerSummary';
import GameLog from './components/GameLog';
import GameHistory from './components/GameHistory';
import Scoreboard from './components/Scoreboard';
import { generateGameSummary } from './services/geminiService';
import { generateCsvContent } from './utils/csvExport';
import type { Stats, LogEntry, StatKey, Player, Game } from './types';
import { calculatePoints } from './utils/statCalculations';

const INITIAL_STATS: Stats = {
  FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0,
  OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0,
};

const createNewGame = (): Game => ({
    id: crypto.randomUUID(),
    stats: { ...INITIAL_STATS },
    log: [],
    opposition: 'Opponent',
    gameDate: new Date().toISOString().split('T')[0],
    summary: '',
    playerTeamScore: null,
    oppositionTeamScore: null,
});

const STORAGE_KEY = 'basketball-stat-tracker-state-v3';

const placeholderIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OSA0IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

const App: React.FC = () => {
  const [player, setPlayer] = useState<Player>({ id: 'player1', name: 'Player 1', photo: null });
  const [games, setGames] = useState<Game[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string | undefined>();
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [summaryModalGame, setSummaryModalGame] = useState<Game | null>(null);
  const [finishGameModalOpen, setFinishGameModalOpen] = useState(false);
  const [finalScores, setFinalScores] = useState({ player: '', opponent: '' });
  
  const gameLogRef = useRef<HTMLDivElement>(null);

  const currentGame = games.find(g => g.id === currentGameId);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        setPlayer(savedState.player);
        setGames(savedState.games);
        setCurrentGameId(savedState.currentGameId);
        setIsGameActive(!!savedState.currentGameId);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if(games.length > 0 || currentGameId || player.photo) { // only save if there is something to save
        const stateToSave = { player, games, currentGameId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [player, games, currentGameId]);

  const handleStatUpdate = useCallback((actionText: string, statChanges: Partial<Stats>) => {
    if (!currentGameId) return;

    setGames(prevGames => {
      return prevGames.map(game => {
        if (game.id === currentGameId) {
          const newStats = { ...game.stats };
          const newLog = [...game.log];

          for (const key in statChanges) {
            const statKey = key as StatKey;
            newStats[statKey] += statChanges[statKey]!;
          }

          newLog.unshift({
            id: crypto.randomUUID(),
            timestamp: new Date().toLocaleTimeString(),
            actionText,
            statChanges,
          });

          return { ...game, stats: newStats, log: newLog };
        }
        return game;
      });
    });
  }, [currentGameId]);
  
  const handleUndo = useCallback((logId: string) => {
    if (!currentGameId) return;

    setGames(prevGames => {
      return prevGames.map(game => {
        if (game.id === currentGameId) {
            const logEntryToUndo = game.log.find(entry => entry.id === logId);
            if (!logEntryToUndo) return game;

            const newStats = { ...game.stats };
            for (const key in logEntryToUndo.statChanges) {
                const statKey = key as StatKey;
                newStats[statKey] -= logEntryToUndo.statChanges[statKey]!;
            }

            const newLog = game.log.filter(entry => entry.id !== logId);
            return { ...game, stats: newStats, log: newLog };
        }
        return game;
      });
    });
  }, [currentGameId]);

  const handleNewGame = () => {
    const newGame = createNewGame();
    setGames(prev => [...prev, newGame]);
    setCurrentGameId(newGame.id);
    setIsGameActive(true);
  };

  const handleOpenFinishGameModal = () => {
    if (!currentGame) return;
    setFinalScores({
        player: calculatePoints(currentGame.stats).toString(),
        opponent: ''
    });
    setFinishGameModalOpen(true);
  };

  const handleConfirmFinishGame = async () => {
    if (!currentGame) return;

    setFinishGameModalOpen(false);
    setIsLoadingSummary(true);
    setError(null);
    
    const playerScore = finalScores.player ? parseInt(finalScores.player, 10) : null;
    const opponentScore = finalScores.opponent ? parseInt(finalScores.opponent, 10) : null;

    const gameToSummarize = {
        ...currentGame,
        playerTeamScore: playerScore,
        oppositionTeamScore: opponentScore,
    };
    
    // Update game state immediately with scores
    setGames(prevGames => prevGames.map(g => g.id === currentGameId ? gameToSummarize : g));

    let summaryText = '';
    try {
      const stream = await generateGameSummary(player.name, gameToSummarize);
      for await (const chunk of stream) {
        summaryText += chunk.text;
        setGames(prevGames => prevGames.map(g => 
            g.id === currentGameId ? { ...g, summary: summaryText } : g
        ));
      }
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsLoadingSummary(false);
        setIsGameActive(false);
        setCurrentGameId(undefined);
    }
  };

  const handleSelectGame = (game: Game) => {
    setCurrentGameId(game.id);
    setIsGameActive(true);
  };

  const handleDeleteGame = (gameId: string) => {
    if(window.confirm("Are you sure you want to delete this game history? This action cannot be undone.")) {
        setGames(prev => prev.filter(g => g.id !== gameId));
    }
  };
  
  const handleExport = () => {
    if (!currentGame) return;
    try {
        const csvContent = generateCsvContent(player.name, currentGame);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stats_${player.name}_${currentGame.gameDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(err) {
        console.error("Failed to export CSV:", err);
        setError("Could not export data.");
    }
  }

  const handleViewSummary = (game: Game) => {
    setSummaryModalGame(game);
  };

  const handleCloseSummaryModal = () => {
    setSummaryModalGame(null);
  };
  
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("Image file is too large. Please use a file under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const photoDataUrl = e.target.result;
          setPlayer(p => ({ ...p, photo: photoDataUrl }));
        }
      };
      reader.onerror = () => {
          setError("Failed to read the image file.");
      }
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <img src="/SSLogo1.png" alt="SwishStats Logo" className="h-10 w-10" />
             <h1 className="text-3xl font-bold tracking-tight text-white">SwishStats</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setPlayerModalOpen(true)} className="flex items-center gap-2">
                <img src={player.photo || placeholderIcon} alt={player.name} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                <span className="font-semibold">{player.name}</span>
            </button>
          </div>
        </header>

        {error && (
            <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-4 animate-fade-in" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                 <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                    <svg className="fill-current h-6 w-6 text-white" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </button>
            </div>
        )}

        <main className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {!isGameActive ? (
            <div className="md:col-span-3 lg:col-span-4 flex flex-col items-center justify-center bg-gray-800 rounded-xl p-8 min-h-[500px]">
                <img src="/SSLogo1.png" alt="SwishStats Logo" className="h-24 w-24 mb-6" />
                <h2 className="text-4xl font-bold mb-4">Welcome to SwishStats</h2>
                <p className="text-lg text-gray-400 mb-8">Ready to track some stats?</p>
                <button onClick={handleNewGame} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-transform transform hover:scale-105">
                    Start New Game
                </button>
                <div className="mt-8 w-full max-w-lg">
                    <GameHistory games={games} currentGameId={currentGameId} onSelectGame={handleSelectGame} onDeleteGame={handleDeleteGame} onViewSummary={handleViewSummary}/>
                </div>
            </div>
          ) : currentGame ? (
            <>
              <div className="lg:col-span-1 md:col-span-1 space-y-4">
                <div className="bg-gray-800 p-4 rounded-xl">
                    <label htmlFor="opposition" className="block text-sm font-medium text-gray-300">Opponent</label>
                    <input
                        type="text"
                        id="opposition"
                        value={currentGame.opposition}
                        onChange={(e) => setGames(games.map(g => g.id === currentGameId ? {...g, opposition: e.target.value} : g))}
                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
                    />
                </div>
                <StatControls onStatUpdate={handleStatUpdate} disabled={isLoadingSummary} />
                 <div className="space-y-2">
                    {currentGame.summary && (
                        <button
                            onClick={() => handleViewSummary(currentGame)}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            View Summary
                        </button>
                    )}
                    <button
                        onClick={handleOpenFinishGameModal}
                        disabled={isLoadingSummary}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isLoadingSummary ? 'Generating...' : 'Finish & Get Summary'}
                    </button>
                     <button
                        onClick={handleExport}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Export to CSV
                    </button>
                </div>
              </div>
              <div className="lg:col-span-2 md:col-span-2 space-y-6">
                <PlayerSummary stats={currentGame.stats} />
                <GameLog log={currentGame.log} onUndo={handleUndo} />
              </div>
              <div className="lg:col-span-1 md:col-span-3">
                 <GameHistory games={games} currentGameId={currentGameId} onSelectGame={handleSelectGame} onDeleteGame={handleDeleteGame} onViewSummary={handleViewSummary}/>
              </div>
            </>
          ) : null}
        </main>
      </div>

      {playerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4">Edit Player</h2>
            
            <div className="mb-4 flex flex-col items-center">
                <img src={player.photo || placeholderIcon} alt="Player" className="w-24 h-24 rounded-full object-cover bg-gray-700 mb-4 border-2 border-gray-600"/>
                <input
                    type="file"
                    id="photoUpload"
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handlePhotoChange}
                />
                <label
                    htmlFor="photoUpload"
                    className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                    Change Photo
                </label>
            </div>

            <div className="mb-6 text-left">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300">Player Name</label>
              <input
                type="text"
                id="playerName"
                value={player.name}
                onChange={(e) => setPlayer(p => ({ ...p, name: e.target.value }))}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2"
              />
            </div>
            
            <div className="text-right">
              <button onClick={() => setPlayerModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {summaryModalGame && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="summary-modal-title">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 id="summary-modal-title" className="text-2xl font-bold text-cyan-400">Game Summary</h2>
                <button onClick={handleCloseSummaryModal} className="text-gray-400 hover:text-white text-3xl leading-none" aria-label="Close summary">&times;</button>
            </div>
            <div className="overflow-y-auto pr-2">
                <div className="mb-2">
                    <p className="text-lg"><span className="font-semibold text-gray-300">Opponent:</span> {summaryModalGame.opposition}</p>
                    <p className="text-sm text-gray-400"><span className="font-semibold">Date:</span> {summaryModalGame.gameDate}</p>
                </div>
                 {summaryModalGame.playerTeamScore !== null && summaryModalGame.oppositionTeamScore !== null && (
                    <Scoreboard 
                        playerTeamName={player.name}
                        playerTeamScore={summaryModalGame.playerTeamScore}
                        oppositionTeamName={summaryModalGame.opposition}
                        oppositionTeamScore={summaryModalGame.oppositionTeamScore}
                    />
                )}
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                {summaryModalGame.summary.split('\n').map((paragraph, index) => (
                    paragraph.trim() && <p key={index} className="text-gray-200">{paragraph}</p>
                ))}
                </div>
            </div>
            <div className="mt-6 text-right flex-shrink-0">
                <button onClick={handleCloseSummaryModal} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Close</button>
            </div>
            </div>
        </div>
      )}

      {finishGameModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Finish Game</h2>
            <p className="text-gray-400 mb-6">Enter the final scores to include them in the summary.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="playerScore" className="block text-sm font-medium text-gray-300">Your Team's Score</label>
                <input
                  type="number"
                  id="playerScore"
                  value={finalScores.player}
                  onChange={(e) => setFinalScores(s => ({ ...s, player: e.target.value }))}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2"
                  placeholder="e.g., 88"
                />
              </div>
              <div>
                <label htmlFor="opponentScore" className="block text-sm font-medium text-gray-300">Opponent's Score</label>
                <input
                  type="number"
                  id="opponentScore"
                  value={finalScores.opponent}
                  onChange={(e) => setFinalScores(s => ({ ...s, opponent: e.target.value }))}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-2"
                  placeholder="e.g., 82"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setFinishGameModalOpen(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                Cancel
              </button>
              <button onClick={handleConfirmFinishGame} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                Confirm &amp; Finish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;