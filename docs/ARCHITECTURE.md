# SwishStats: Application Architecture

This document provides an overview of the SwishStats application's structure, components, and data flow.

## 1. File & Folder Structure

The project has a flat structure, organized by function. All source code resides in the root directory.

```
/
├── components/
│   ├── GameHistory.tsx       # Renders the list of past games
│   ├── GameLog.tsx           # Renders the list of actions in the current game
│   ├── PlayerSummary.tsx     # Displays the player's calculated stats
│   ├── Scoreboard.tsx        # Displays the final score in the summary modal
│   └── StatControls.tsx      # Renders all the buttons for stat tracking
├── docs/
│   ├── ARCHITECTURE.md       # This file
│   ├── DEVELOPMENT_LOG.md    # Log of development activities
│   ├── MVP_ROADMAP.md        # Project overview, features, and roadmap
│   └── README.md             # Docs folder README with version info
├── services/
│   └── geminiService.ts      # Handles all communication with the Google Gemini API
├── utils/
│   ├── csvExport.ts          # Logic for generating and downloading the CSV file
│   └── statCalculations.ts   # Helper functions for calculating points, percentages, etc.
├── App.tsx                   # Main application component, manages all state
├── index.html                # The main HTML file and entry point
├── index.tsx                 # Renders the React application
├── manifest.json             # PWA manifest file
├── sw.js                     # Service worker for offline functionality
└── types.ts                  # TypeScript type definitions for the application
```

## 2. Component Breakdown

- **`App.tsx` (Core Component):**
  - The orchestrator of the entire application.
  - Manages all application state, including player info, games, logs, and UI state (e.g., active game, open modals).
  - Contains all the core logic for handling user interactions (updating stats, starting/finishing games, undoing actions).
  - Renders all other components and passes state down to them as props.
  - Handles communication with `localStorage` for data persistence.

- **`StatControls.tsx`:**
  - A purely presentational component that displays the grid of stat-tracking buttons.
  - It receives a single callback function (`onStatUpdate`) from `App.tsx` which it calls with the appropriate action text and stat changes when a button is pressed.

- **`PlayerSummary.tsx`:**
  - Displays the player's current stats in a formatted, easy-to-read dashboard.
  - Receives the `stats` object as a prop and uses utility functions from `statCalculations.ts` to display derived data like total points.

- **`GameLog.tsx`:**
  - Renders the chronological list of actions taken during the game.
  - Receives the `log` array and an `onUndo` callback function from `App.tsx`.

- **`GameHistory.tsx`:**
  - Displays the list of all previously completed games.
  - Receives the full `games` array and callbacks from `App.tsx` to handle loading, deleting, or viewing the summary of a past game.

- **`Scoreboard.tsx`:**
  - A simple, presentational component to display the final score in a visually appealing way within the summary modal.

## 3. Data Flow & State Management

The application follows a unidirectional data flow pattern, which is a core principle of React.

1.  **State:** All state is held within the `App.tsx` component.
2.  **Downward Flow:** State is passed down to child components via props (e.g., `App` -> `PlayerSummary` with `stats`).
3.  **Upward Flow:** Child components communicate back up to `App.tsx` using callback functions passed as props (e.g., a button click in `StatControls` calls `onStatUpdate` in `App`).
4.  **State Update:** `App.tsx` updates its state.
5.  **Re-render:** React re-renders `App.tsx` and any child components whose props have changed, ensuring the UI is always in sync with the state.

This simple, centralized approach avoids the need for more complex state management libraries like Redux or MobX for an application of this scale.

## 4. Services and Utilities

- **`geminiService.ts`:**
  - This service isolates the logic for interacting with the Gemini API. It constructs the prompt based on game data and handles the streaming API call, abstracting this complexity away from the `App` component.

- **`csvExport.ts` & `statCalculations.ts`:**
  - These utility files contain pure functions that perform specific tasks. This separation of concerns makes the code cleaner, easier to test, and more reusable.
