
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StatControls } from './components/StatControls';
import PlayerSummary from './components/PlayerSummary';
import GameLog from './components/GameLog';
import GameHistory from './components/GameHistory';
import { generateGameSummary } from './services/geminiService';
import { generateCsvContent } from './utils/csvExport';
import type { Stats, LogEntry, StatKey, Player, Game } from './types';

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
});

const STORAGE_KEY = 'basketball-stat-tracker-state-v3';

const placeholderIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OSA0IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="text-gray-300 mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 text-white font-semibold rounded-lg transition-colors ${confirmClass}`}
            aria-label="Confirm action"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PlayerModalProps {
    playerToEdit: Player | null;
    onClose: () => void;
    onSave: (player: Player) => void;
}

const PlayerModal: React.FC<PlayerModalProps> = ({ playerToEdit, onClose, onSave }) => {
    const [name, setName] = useState(playerToEdit?.name || '');
    const [photo, setPhoto] = useState<string | null>(playerToEdit?.photo || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!playerToEdit;

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            alert("Player name cannot be empty.");
            return;
        }
        onSave({
            id: playerToEdit?.id || crypto.randomUUID(),
            name: name.trim(),
            photo,
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-6">{isEditing ? 'Edit Player' : 'Add New Player'}</h2>
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group">
                        <img src={photo || placeholderIcon} alt="Player" className="h-24 w-24 rounded-full object-cover border-2 border-gray-600 group-hover:border-cyan-400 bg-gray-700" />
                        <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                    </div>
                    {photo && <button onClick={() => setPhoto(null)} className="text-sm text-red-400 hover:text-red-500">Remove Photo</button>}
                </div>
                <div className="mb-6">
                    <label htmlFor="playerName" className="block text-sm font-medium text-gray-400 mb-1">Player Name</label>
                    <input id="playerName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="Enter player name" />
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg">Save</button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [playerGames, setPlayerGames] = useState<Record<string, Game[]>>({});
  const [viewingGame, setViewingGame] = useState<Game | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  
  const playerDropdownRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  const initializeNewPlayer = (id: string, name = 'Player 1', photo: string | null = null) => {
    const newPlayer: Player = { id, name, photo };
    setPlayers(prev => [...prev, newPlayer]);
    setPlayerGames(prev => ({...prev, [id]: [createNewGame()] }));
    setActivePlayerId(id);
  };

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState && savedState.players?.length > 0) {
          setPlayers(savedState.players);
          setActivePlayerId(savedState.activePlayerId || savedState.players[0].id);
          // V3 structure
          if (savedState.playerGames) {
             setPlayerGames(savedState.playerGames);
          } else if (savedState.gameStates) { // V2 structure, migrate
            const migratedGames: Record<string, Game[]> = {};
            Object.keys(savedState.gameStates).forEach(pId => {
              migratedGames[pId] = [{ ...savedState.gameStates[pId], id: crypto.randomUUID() }];
            });
            setPlayerGames(migratedGames);
          }
        } else {
            throw new Error("No players found in saved state.");
        }
      } else {
        initializeNewPlayer(crypto.randomUUID());
      }
    } catch (error) {
      console.error("Error loading state, initializing new state:", error);
      localStorage.removeItem(STORAGE_KEY);
      initializeNewPlayer(crypto.randomUUID());
    } finally {
        isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
        try {
            const stateToSave = { players, activePlayerId, playerGames };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Error saving state to localStorage:", error);
        }
    }
  }, [players, activePlayerId, playerGames]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (playerDropdownRef.current && !playerDropdownRef.current.contains(event.target as Node)) {
        setIsPlayerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePlayer = players.find(p => p.id === activePlayerId);
  const activePlayerGames = activePlayerId ? playerGames[activePlayerId] || [] : [];
  const currentGame = activePlayerGames[0];
  const gameToDisplay = viewingGame || currentGame;
  const isReadOnly = !!viewingGame;

  const updatePlayerGames = (playerId: string, games: Game[]) => {
    setPlayerGames(prev => ({ ...prev, [playerId]: games }));
  };
  
  const handleStatUpdate = useCallback((actionText: string, statChanges: Partial<Stats>) => {
    if (!activePlayerId || !currentGame) return;
    
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
    
    const updatedGame = { ...currentGame, stats: newStats, log: [newLogEntry, ...currentGame.log] };
    updatePlayerGames(activePlayerId, [updatedGame, ...activePlayerGames.slice(1)]);
  }, [activePlayerId, currentGame, activePlayerGames]);

  const handleUndo = useCallback((id: string) => {
    if (!activePlayerId || !currentGame) return;
    
    const entryToUndo = currentGame.log.find(entry => entry.id === id);
    if (!entryToUndo) return;

    const newStats = { ...currentGame.stats };
    for (const key in entryToUndo.statChanges) {
        newStats[key as StatKey] -= entryToUndo.statChanges[key as StatKey]!;
    }
    
    const newLog = currentGame.log.filter(entry => entry.id !== id);
    const updatedGame = { ...currentGame, stats: newStats, log: newLog };
    updatePlayerGames(activePlayerId, [updatedGame, ...activePlayerGames.slice(1)]);
  }, [activePlayerId, currentGame, activePlayerGames]);

  const handleResetGame = () => {
    if (!activePlayerId || !currentGame) return;

    const resetGame = {
      ...currentGame,
      stats: { ...INITIAL_STATS },
      log: [],
      summary: '',
    };
    
    const newGamesForPlayer = [resetGame, ...activePlayerGames.slice(1)];
    updatePlayerGames(activePlayerId, newGamesForPlayer);
    setIsResetModalOpen(false);
  };

  const handleDeleteGame = () => {
    if (!activePlayerId || !gameToDelete) return;
    const newGames = activePlayerGames.filter(g => g.id !== gameToDelete.id);
    if (viewingGame?.id === gameToDelete.id) {
        setViewingGame(null);
    }
    if (newGames.length === 0) {
        newGames.push(createNewGame());
    }
    updatePlayerGames(activePlayerId, newGames);
    setIsDeleteModalOpen(false);
    setGameToDelete(null);
  };
  
  const handleGenerateSummary = async () => {
    if (!activePlayer || !activePlayerId || !gameToDisplay) return;
    
    setIsGenerating(true);
    // Clear previous summary
    const updateSummary = (summaryPart: string, isNew: boolean) => {
      setPlayerGames(prev => {
        const games = prev[activePlayerId];
        const gameIndex = games.findIndex(g => g.id === gameToDisplay.id);
        if (gameIndex === -1) return prev;
        const updatedGame = { ...games[gameIndex], summary: isNew ? summaryPart : games[gameIndex].summary + summaryPart };
        const newGames = [...games];
        newGames[gameIndex] = updatedGame;
        return { ...prev, [activePlayerId]: newGames };
      });
    };
    
    updateSummary('', true);

    try {
      const stream = await generateGameSummary(activePlayer.name, gameToDisplay);
      for await (const chunk of stream) {
        updateSummary(chunk.text, false);
      }
    } catch (error) {
      console.error("Error streaming summary:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      updateSummary(`Error: ${errorMessage}`, true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!activePlayer || !gameToDisplay || gameToDisplay.log.length === 0) {
      alert("No stats to export for this game.");
      return;
    }

    const { opposition, gameDate, stats, log } = gameToDisplay;
    const csvContent = generateCsvContent(activePlayer.name, opposition, gameDate, stats, log);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const sanitizedPlayer = activePlayer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedOpponent = opposition.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedPlayer}_vs_${sanitizedOpponent}_${gameDate}.csv`;

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleStartNewGame = () => {
    if (!activePlayerId) return;
    const newGame = createNewGame();
    updatePlayerGames(activePlayerId, [newGame, ...activePlayerGames]);
    setViewingGame(null);
    setActiveTab('log');
  };

  const handleOpenPlayerModal = (player: Player | null) => {
    setPlayerToEdit(player);
    setIsPlayerModalOpen(true);
    setIsPlayerDropdownOpen(false);
  };

  const handleSavePlayer = (player: Player) => {
    const isEditing = players.some(p => p.id === player.id);
    if (isEditing) {
        setPlayers(players.map(p => p.id === player.id ? player : p));
    } else {
        initializeNewPlayer(player.id, player.name, player.photo);
    }
    setIsPlayerModalOpen(false);
    setPlayerToEdit(null);
  };

  const handleSelectPlayer = (playerId: string) => {
    setActivePlayerId(playerId);
    setViewingGame(null);
    setIsPlayerDropdownOpen(false);
    if (!playerGames[playerId] || playerGames[playerId].length === 0) {
      setPlayerGames(prev => ({ ...prev, [playerId]: [createNewGame()] }));
    }
  };

  const handleGameInfoChange = (field: 'opposition' | 'gameDate', value: string) => {
    if (!activePlayerId || !currentGame) return;
    const updatedGame = { ...currentGame, [field]: value };
    updatePlayerGames(activePlayerId, [updatedGame, ...activePlayerGames.slice(1)]);
  };
  
  if (!activePlayer || !gameToDisplay) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading Game Data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
            <div className="w-full sm:w-auto">
              <h1 className="text-3xl font-bold text-white tracking-tight">Basketball Stat Tracker <span className="text-cyan-400">AI</span></h1>
              <div className="mt-3 flex items-center gap-4 flex-wrap">
                <div className="relative group flex-shrink-0 cursor-pointer" onClick={() => handleOpenPlayerModal(activePlayer)} role="button" aria-label="Edit player photo and details">
                    <img src={activePlayer.photo || placeholderIcon} alt="Player photo" className="h-16 w-16 rounded-full object-cover border-2 border-gray-600 group-hover:border-cyan-400 transition-colors bg-gray-700"/>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                    </div>
                </div>
                <div className="relative" ref={playerDropdownRef}>
                    <button onClick={() => setIsPlayerDropdownOpen(prev => !prev)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none flex items-center gap-2">
                        {activePlayer.name}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isPlayerDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {isPlayerDropdownOpen && (
                        <div className="absolute top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                            <ul>
                                {players.map(p => (
                                    <li key={p.id} onClick={() => handleSelectPlayer(p.id)} className={`flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer ${p.id === activePlayerId ? 'bg-cyan-900/50' : ''}`}>
                                        <img src={p.photo || placeholderIcon} alt={p.name} className="h-8 w-8 rounded-full object-cover bg-gray-700" />
                                        <span className="text-white">{p.name}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-2 border-t border-gray-700">
                                <button onClick={() => handleOpenPlayerModal(null)} className="w-full text-center px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm">Add New Player</button>
                            </div>
                        </div>
                    )}
                </div>
                 <span className="text-gray-500 hidden sm:inline">vs</span>
                 <input type="text" value={gameToDisplay.opposition} onChange={(e) => handleGameInfoChange('opposition', e.target.value)} disabled={isReadOnly} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-800/50" placeholder="Opponent" aria-label="Opponent Name"/>
                 <input type="date" value={gameToDisplay.gameDate} onChange={(e) => handleGameInfoChange('gameDate', e.target.value)} disabled={isReadOnly} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1 text-lg text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-800/50" aria-label="Game Date"/>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
              <button onClick={handleStartNewGame} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Start New Game</button>
              <button onClick={handleExport} disabled={gameToDisplay.log.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Export CSV</button>
              <button onClick={() => setIsResetModalOpen(true)} disabled={isReadOnly || currentGame?.log.length === 0} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Reset Game</button>
            </div>
          </header>

          {isReadOnly && (
            <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 rounded-lg flex justify-between items-center">
                <span>Viewing a past game. Stats are read-only.</span>
                <button onClick={() => setViewingGame(null)} className="font-semibold hover:text-white">Return to Current Game</button>
            </div>
          )}

          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PlayerSummary stats={gameToDisplay.stats} />
              <StatControls onStatUpdate={handleStatUpdate} disabled={isReadOnly} />
               <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-white">AI Game Summary</h2>
                  <button onClick={handleGenerateSummary} disabled={isGenerating || gameToDisplay.log.length === 0} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
                      {isGenerating ? 'Generating...' : `Generate ${isReadOnly ? ' ' : 'Performance '}Summary`}
                  </button>
                  {(gameToDisplay.summary || isGenerating) && (
                      <div className="mt-4 p-4 bg-gray-700/50 rounded-lg min-h-[100px]">
                          <p className="whitespace-pre-wrap text-gray-300">
                            {gameToDisplay.summary}
                            {isGenerating && !gameToDisplay.summary && <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1 align-bottom"></span>}
                          </p>
                      </div>
                  )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="flex mb-2 border-b border-gray-700">
                <button onClick={() => setActiveTab('log')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'log' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>Game Log</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'history' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>Game History</button>
              </div>
              
              {activeTab === 'log' && <GameLog log={gameToDisplay.log} onUndo={isReadOnly ? () => {} : handleUndo} />}
              {activeTab === 'history' && <GameHistory games={activePlayerGames} currentGameId={currentGame?.id} onSelectGame={(game) => setViewingGame(game)} onDeleteGame={(id) => { setGameToDelete(activePlayerGames.find(g => g.id === id) || null); setIsDeleteModalOpen(true); }} />}

            </div>
          </main>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteGame}
        title="Delete Game?"
      >
        <p>Are you sure you want to delete the game vs {gameToDelete?.opposition} on {gameToDelete?.gameDate}? This action cannot be undone.</p>
      </Modal>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetGame}
        title="Reset Current Game?"
        confirmText="Reset"
        confirmClass="bg-red-600 hover:bg-red-700"
      >
        <p>Are you sure you want to reset all stats and the log for the current game? This action cannot be undone.</p>
      </Modal>

      {isPlayerModalOpen && (
        <PlayerModal 
            playerToEdit={playerToEdit}
            onClose={() => setIsPlayerModalOpen(false)}
            onSave={handleSavePlayer}
        />
      )}
    </>
  );
};

export default App;
