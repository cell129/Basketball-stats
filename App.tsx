import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StatControls } from './components/StatControls';
import PlayerSummary from './components/PlayerSummary';
import GameLog from './components/GameLog';
import { generateGameSummary } from './services/geminiService';
import { generateCsvContent } from './utils/csvExport';
import type { Stats, LogEntry, StatKey } from './types';

// The initial, empty state for a player's statistics. Used for starting a new game or resetting.
const INITIAL_STATS: Stats = {
  FGM: 0, FGA: 0, TPM: 0, TPA: 0, FTM: 0, FTA: 0,
  OREB: 0, DREB: 0, AST: 0, STL: 0, BLK: 0, TOV: 0, PF: 0,
};

// A unique key for storing the application's state in the browser's localStorage.
const STORAGE_KEY = 'basketball-stat-tracker-state';

// A default placeholder SVG for the player photo, displayed when no image has been uploaded.
// This is encoded as a base64 Data URL to avoid needing a separate file asset.
const placeholderIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OSA0IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

/**
 * @interface ModalProps
 * @description Defines the props (properties) for the generic Modal component.
 * This ensures type safety for any component that uses the Modal.
 */
interface ModalProps {
  isOpen: boolean;       // Controls whether the modal is visible.
  onClose: () => void;   // Callback function to execute when closing the modal.
  onConfirm: () => void; // Callback function to execute when the confirm action is taken.
  title: string;         // The title displayed at the top of the modal.
  children: React.ReactNode; // The content (body) of the modal.
}

/**
 * @component Modal
 * @description A reusable, accessible modal dialog component. It is used in this app
 * to get user confirmation before performing a destructive action like resetting the game.
 * It overlays the entire screen to focus the user's attention.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  // If the modal is not set to be open, render nothing.
  if (!isOpen) return null;

  return (
    // The backdrop overlay. Clicking it will close the modal.
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog" // Identifies the element as a dialog window.
      aria-modal="true" // Indicates that content outside the modal is inert.
      aria-labelledby="modal-title" // Associates the modal with its title for screen readers.
    >
      {/* The modal container. Clicking inside it does not close the modal. */}
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()} // Prevents clicks from bubbling up to the backdrop.
      >
        <h2 id="modal-title" className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="text-gray-300 mb-6">{children}</div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            aria-label="Cancel action" // Provides an accessible label for the button.
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            aria-label="Confirm action" // Provides an accessible label for the button.
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * @component App
 * @description This is the root component of the application. It serves as the main controller,
 * managing all application state, handling user interactions, and orchestrating data flow between
 * child components like the stat controls, player summary, and game log.
 */
const App: React.FC = () => {
  // ================================================================================
  // SECTION: State Management
  // ================================================================================
  // This section uses React hooks (`useState`, `useRef`) to manage all the dynamic data
  // required for the application to function.

  // --- Game Setup State ---
  // State related to the context of the game being tracked.
  const [playerName, setPlayerName] = useState<string>('Player 1');
  const [opposition, setOpposition] = useState<string>('Opponent');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [playerPhoto, setPlayerPhoto] = useState<string | null>(null); // Stored as a base64 Data URL.

  // --- Core Game Data State ---
  // The primary data being recorded during the game.
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [log, setLog] = useState<LogEntry[]>([]); // A chronological list of all actions.
  
  // --- AI Summary State ---
  // State related to the AI-powered game summary feature.
  const [isGenerating, setIsGenerating] = useState<boolean>(false); // Tracks if the API call is in progress.
  const [summary, setSummary] = useState<string>(''); // Stores the generated summary text.
  
  // --- UI Component State ---
  // State for controlling UI elements like modals and file inputs.
  const fileInputRef = useRef<HTMLInputElement>(null); // A ref to programmatically access the hidden file input.
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); // Controls the visibility of the reset confirmation modal.

  // ================================================================================
  // SECTION: Local Storage Persistence
  // ================================================================================
  // These `useEffect` hooks provide persistence. They save the game state to the
  // browser's localStorage, allowing the user to refresh or close the tab
  // without losing their progress.

  /**
   * @effect loadStateFromLocalStorage
   * @description This effect runs once when the component first mounts. It checks localStorage
   * for any previously saved game state and, if found, hydrates the component's state with that data.
   */
  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        // Safely set state, falling back to defaults if properties are missing.
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
      // Catches potential errors, e.g., if localStorage is disabled or the data is corrupt.
      console.error("Error loading state from localStorage:", error);
    }
  }, []); // The empty dependency array `[]` ensures this effect runs only on the initial render.

  /**
   * @effect saveStateToLocalStorage
   * @description This effect runs whenever a key piece of game state changes. It bundles the current
   * state into a single object and saves it to localStorage as a JSON string.
   */
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
      // Catches potential errors, e.g., if storage quota is exceeded.
      console.error("Error saving state to localStorage:", error);
    }
    // The dependency array lists all state variables that should trigger a save operation.
  }, [playerName, opposition, gameDate, stats, log, playerPhoto]);

  // ================================================================================
  // SECTION: Core Logic Handlers
  // ================================================================================
  // These functions encapsulate the main business logic of the application, such as
  // updating stats, undoing actions, and resetting the game state.

  /**
   * @callback handleStatUpdate
   * @description This function is called when a stat button is pressed. It updates the stats object
   * immutably and adds a new entry to the game log to record the action.
   * `useCallback` is used for performance optimization, ensuring the function reference doesn't
   * change on re-renders, which prevents unnecessary re-renders of child components (like `StatControls`).
   */
  const handleStatUpdate = useCallback((actionText: string, statChanges: Partial<Stats>) => {
    // Update stats using a functional update to ensure we have the latest state.
    setStats(prevStats => {
      const newStats = { ...prevStats }; // Create a new object to maintain immutability.
      // Iterate over the changes and apply them to the new stats object.
      for (const key in statChanges) {
        newStats[key as StatKey] += statChanges[key as StatKey]!;
      }
      return newStats;
    });

    // Create a new log entry for this action.
    const newLogEntry: LogEntry = {
      id: crypto.randomUUID(), // A universally unique ID for the log entry, useful for keys and undo operations.
      timestamp: new Date().toLocaleTimeString(),
      actionText,
      statChanges, // Store the exact changes for the undo functionality.
    };
    // Prepend the new entry to the log so it appears at the top of the list.
    setLog(prevLog => [newLogEntry, ...prevLog]);
  }, []); // Empty dependency array as this function doesn't depend on any state props.

  /**
   * @callback handleUndo
   * @description Reverts a specific action from the game log. It finds the action by its ID,
   * subtracts its stat changes from the current stats, and removes the entry from the log.
   * `useCallback` depends on `log` because it needs access to the current log to find the entry to undo.
   */
  const handleUndo = useCallback((id: string) => {
    const entryToUndo = log.find(entry => entry.id === id);
    if (!entryToUndo) return; // Exit if the entry isn't found.

    // Revert the stats by subtracting the changes from the original action.
    setStats(prevStats => {
      const newStats = { ...prevStats };
      for (const key in entryToUndo.statChanges) {
        newStats[key as StatKey] -= entryToUndo.statChanges[key as StatKey]!;
      }
      return newStats;
    });

    // Remove the undone entry from the log.
    setLog(prevLog => prevLog.filter(entry => entry.id !== id));
  }, [log]); // This function must be re-created if the `log` state changes.

  /**
   * @function handleConfirmReset
   * @description Resets the entire application state to its initial values, effectively
   * starting a new game. It also clears the persisted state from localStorage.
   */
  const handleConfirmReset = () => {
    // Reset all state variables to their default values.
    setStats(INITIAL_STATS);
    setLog([]);
    setSummary('');
    setPlayerName('Player 1');
    setOpposition('Opponent');
    setGameDate(new Date().toISOString().split('T')[0]);
    setPlayerPhoto(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing state from localStorage:", error);
    }
    // Close the confirmation modal after the reset is complete.
    setIsResetModalOpen(false);
  };

  // ================================================================================
  // SECTION: API and External Interactions
  // ================================================================================
  // Functions for interacting with external services (like the Gemini API) or browser
  // features (like file downloads).

  /**
   * @function handleGenerateSummary
   * @description Initiates a request to the Gemini API to generate a game summary.
   * It handles the streaming response, updating the UI in real-time as text chunks arrive.
   */
  const handleGenerateSummary = async () => {
    setIsGenerating(true); // Put the UI in a loading state.
    setSummary(''); // Clear any previous summary.
    try {
      const stream = await generateGameSummary(playerName, opposition, gameDate, stats, log);
      // As each chunk of text arrives from the stream, append it to the summary.
      for await (const chunk of stream) {
        setSummary(prev => prev + chunk.text);
      }
    } catch (error) {
      console.error("Error streaming summary:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setSummary(`Error: ${errorMessage}`); // Display a user-friendly error message.
    } finally {
      setIsGenerating(false); // Ensure the loading state is turned off, even if an error occurs.
    }
  };

  /**
   * @function handleExport
   * @description Generates a CSV file of the game stats and log, then triggers a
   * download in the user's browser.
   */
  const handleExport = () => {
    if (log.length === 0) {
      alert("No stats to export.");
      return;
    }

    const csvContent = generateCsvContent(playerName, opposition, gameDate, stats, log);
    // Create a Blob, which is a file-like object of immutable, raw data.
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Sanitize player/opponent names for a clean filename.
    const sanitizedPlayer = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedOpponent = opposition.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedPlayer}_vs_${sanitizedOpponent}_${gameDate}.csv`;

    // The "temporary link" trick: create a hidden link, set its href to the blob URL,
    // programmatically click it to trigger the download, then remove it.
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the object URL to release memory.
  };

  // ================================================================================
  // SECTION: UI Event Handlers
  // ================================================================================
  // These handlers are for direct user interactions with specific UI elements,
  // such as uploading or removing the player's photo.

  /**
   * @function handlePhotoUploadClick
   * @description When the user clicks the photo area, this function programmatically
   * triggers a click on the hidden file input element, opening the file selection dialog.
   */
  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * @function handlePhotoChange
   * @description This is triggered when the user selects a file in the file dialog.
   * It uses the FileReader API to read the selected image as a base64 Data URL
   * and stores it in the component's state, which updates the displayed image.
   */
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

  /**
   * @function handleRemovePhoto
   * @description Clears the player photo from the state, reverting the UI to the
   * default placeholder icon.
   */
  const handleRemovePhoto = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevents the click from bubbling up to the parent div's click handler.
      setPlayerPhoto(null);
  };

  // ================================================================================
  // SECTION: Render Method
  // ================================================================================
  // This is the JSX that defines the structure and appearance of the component.
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* --- Application Header --- */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
            {/* Game Info and Player Details */}
            <div className="w-full sm:w-auto">
              <h1 className="text-3xl font-bold text-white tracking-tight">Basketball Stat Tracker <span className="text-cyan-400">AI</span></h1>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Player Photo Uploader */}
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
                        {/* Upload Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    {/* Remove Photo Button (only visible if a photo exists) */}
                    {playerPhoto && (
                        <button
                            onClick={handleRemovePhoto}
                            className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all"
                            aria-label="Remove player photo"
                        >
                            {/* 'X' Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {/* Hidden file input, controlled by the ref */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        className="hidden"
                        aria-hidden="true" // Hide from screen readers as it's not user-interactive.
                    />
                </div>
                {/* Editable Inputs for Game Details */}
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
            {/* Action Buttons */}
            <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
              <button
                  onClick={handleExport}
                  disabled={log.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                  Export CSV
              </button>
              <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                  Reset Game
              </button>
            </div>
          </header>

          {/* --- Main Content Area --- */}
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Stats and Controls */}
            <div className="lg:col-span-2 space-y-6">
              <PlayerSummary stats={stats} />
              <StatControls onStatUpdate={handleStatUpdate} />
              {/* AI Summary Section */}
               <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <h2 className="text-xl font-bold mb-4 text-white">AI Game Summary</h2>
                  <button
                      onClick={handleGenerateSummary}
                      disabled={isGenerating || log.length === 0}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                      {isGenerating ? 'Generating...' : 'Generate Performance Summary'}
                  </button>
                  {/* Summary display area, shown only when generating or if a summary exists */}
                  {(summary || isGenerating) && (
                      <div className="mt-4 p-4 bg-gray-700/50 rounded-lg min-h-[100px]">
                          <p className="whitespace-pre-wrap text-gray-300">
                            {summary}
                            {/* Blinking cursor effect while generating */}
                            {isGenerating && <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1 align-bottom"></span>}
                          </p>
                      </div>
                  )}
              </div>
            </div>

            {/* Right Column: Game Log */}
            <div className="lg:col-span-1">
              <GameLog log={log} onUndo={handleUndo} />
            </div>
          </main>
        </div>
      </div>

      {/* --- Modal Component --- */}
      {/* This is rendered outside the main layout but is controlled by state. */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Game Data?"
      >
        <p>Are you sure you want to reset the game? All currently tracked stats and game log entries will be permanently deleted.</p>
      </Modal>
    </>
  );
};

export default App;
