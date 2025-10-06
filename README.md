
# Basketball Stat Tracker AI

A modern, offline-first Progressive Web App (PWA) for tracking a basketball player's stats in real-time during a game. This application is enhanced with an AI-powered feature that generates insightful game summaries using the Google Gemini API.

![Basketball Stat Tracker AI Screenshot](https://storage.googleapis.com/aistudio-hosting/generative-ai-studio/gallery/55989182-358b-4919-9f75-0e6d542da9f5/thumbnail.jpeg)

## Key Features

- **Real-Time Stat Tracking**: Easily record every key stat, including field goals (FGM/FGA), 3-pointers (TPM/TPA), free throws (FTM/FTA), rebounds (OREB/DREB), assists, steals, blocks, turnovers, and fouls.
- **AI-Powered Summaries**: Leverage the Google Gemini API to generate a detailed, analytical summary of the player's performance based on the collected stats and game log.
- **Comprehensive Player Dashboard**: View all key stats and shooting percentages in a clean, easy-to-read summary panel.
- **Dynamic Game Log**: Every action is timestamped and logged. An "Undo" feature allows for easy correction of mistakes.
- **Multi-Game Management**: Save and manage multiple games. Easily create new games, load previous sessions, or delete old ones through an intuitive sidebar.
- **Player Customization**: Personalize the experience by editing player/opponent names, game dates, and uploading a player photo.
- **Data Export**: Export complete game stats and the event log to a CSV file for further analysis.
- **Offline-First PWA**: Fully functional offline. The app can be "installed" on your desktop or mobile home screen for a native-app-like experience, thanks to a robust service worker.
- **Responsive Design**: A seamless experience across all devices, from mobile phones to desktop monitors.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini API (`@google/genai`)
- **PWA**: Service Worker API, Web App Manifest
- **State Management**: React Hooks (`useState`, `useEffect`, `useCallback`)
- **Persistence**: `localStorage` for saving game data.

## How to Use

1.  **Game Setup**:
    - On first launch, a new game is automatically created.
    - Click on the player photo icon to upload a custom image.
    - Edit the "Player Name," "Opponent," and "Game Date" fields as needed.

2.  **Tracking Stats**:
    - Use the buttons in the **Stat Controls** panel to record actions as they happen in the game.
    - The **Player Stats** summary and **Game Log** will update in real-time.

3.  **Correcting Mistakes**:
    - If you make an error, find the action in the **Game Log** and click the **Undo** button next to it. The stats will be reverted automatically.

4.  **Managing Games**:
    - Click the **Manage Games** button to open the sidebar.
    - From here, you can **+ Create New Game**, **Select** a different saved game to load, or **Delete** a game.
    - Click the **Save Game** button at any time for a manual save. Progress is also autosaved.

5.  **Generating an AI Summary**:
    - Once you have recorded sufficient game data, click the **Generate Performance Summary** button.
    - The app will send the stats and recent game events to the Gemini API and display an insightful analysis of the player's performance.

6.  **Exporting Data**:
    - Click the **Export CSV** button to download a CSV file containing the final stat line and the full, chronologically ordered game log.

## PWA Installation

For a more integrated experience, you can install this app on your device.

-   **On Desktop (Chrome, Edge)**: Look for an "Install" icon in the address bar and follow the prompts.
-   **On Mobile (iOS/Safari)**: Tap the "Share" button and then select "Add to Home Screen."
-   **On Mobile (Android/Chrome)**: Tap the three-dot menu and select "Install app" or "Add to Home screen."

## Environment Variables

This project uses the Google Gemini API to generate game summaries. To function correctly, the environment where the application is run must provide a valid API key.

-   `API_KEY`: Your Google Generative AI API key.

The application is configured to access this key via `process.env.API_KEY`.
