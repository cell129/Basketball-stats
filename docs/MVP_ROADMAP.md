# SwishStats: Project Overview & Roadmap

## 1. Project Overview

SwishStats is a modern, offline-first Progressive Web App (PWA) designed for youth basketball players and their parents or coaches. It allows for real-time tracking of a player's statistics during a game. After the game, it leverages the Google Gemini API to generate a personalized, motivating, and "hype-filled" summary of the player's performance, along with gentle suggestions for improvement.

**Goal:** To make stat tracking fun and insightful, providing young athletes with positive reinforcement and clear, actionable feedback powered by AI.

---

## 2. Core Features (What Works)

- **Real-Time Stat Tracking:** A user-friendly interface with large buttons allows for easy input of all major basketball stats (FGM/A, 3PM/A, FTM/A, rebounds, assists, steals, blocks, turnovers, fouls).
- **Live Game Log:** Every action is timestamped and added to a reversible log. Users can undo any mistaken entry, which automatically corrects the stats.
- **Dynamic Player Summary:** A dashboard displays key calculated stats like total points and shooting percentages, updating instantly with each new entry.
- **Player Personalization:** Users can set a player's name and upload a profile photo.
- **Final Score Entry:** At the end of a game, users can enter the final team scores to provide context for the game's outcome.
- **AI-Powered Game Summaries:** Using the Google Gemini API (`gemini-2.5-flash`), the app generates a unique, energetic, and encouraging summary of the player's performance based on their final stats, recent plays, and the game's outcome.
- **Game History:** All completed games are saved locally. Users can view past game summaries, reload a game to continue tracking, or delete it.
- **Visually Appealing Scoreboard:** Completed game summaries feature a clear and attractive scoreboard highlighting the final scores and winner.
- **CSV Data Export:** Users can export a complete game's data, including the summary box score and the full chronological game log, as a CSV file.
- **Offline-First Functionality (PWA):** The app is a fully-fledged Progressive Web App. A service worker caches all necessary application assets, allowing it to load and function entirely offline. All data is stored in the browser's `localStorage`.
- **Responsive Design:** The UI is built with TailwindCSS and is fully responsive, working seamlessly on mobile phones, tablets, and desktops.

---

## 3. Architectural Decisions

- **Tech Stack:**
  - **Framework:** React with TypeScript. Chosen for its component-based architecture, strong typing for maintainability, and vast ecosystem.
  - **Styling:** TailwindCSS. Selected for rapid UI development and easy creation of a responsive, modern design without writing custom CSS.
  - **Build/Dependencies:** No build step. The app uses ES Modules directly in the browser via an `importmap`, which simplifies the setup and makes it lightweight. Dependencies like React and `@google/genai` are loaded from a CDN.
  - **AI Integration:** `@google/genai` SDK. The official SDK is used to interact with the Gemini API for generating game summaries in a streaming fashion for a better user experience.

- **State Management:**
  - React's built-in `useState`, `useEffect`, and `useCallback` hooks are used for state management. This approach is sufficient for the current complexity of the app and avoids adding external libraries, keeping the app lean.
  - The entire application state (player info, games, logs) is centralized in the main `App.tsx` component and passed down as props to child components.

- **Data Persistence:**
  - **`localStorage`:** Chosen for its simplicity and universal browser support. It's perfect for storing the application's state as a single JSON object. This allows the user to close their browser and resume their session exactly where they left off. For a more robust, multi-user application, a database like IndexedDB or a cloud-based solution would be considered.

- **Offline-First (PWA):**
  - A **Service Worker** (`sw.js`) is implemented to proactively cache all static assets (HTML, JS, SVG icons, etc.). This ensures the application shell loads instantly, even without an internet connection. The AI summary generation is the only feature that requires an active internet connection.

- **Modularity:**
  - The application is broken down into logical components (`StatControls`, `GameLog`, `PlayerSummary`, etc.), services (`geminiService`), and utility functions (`statCalculations`, `csvExport`), promoting code reuse and maintainability.

---

## 4. Idea Inbox & MVP Roadmap

This section outlines potential features and a path forward for the app.

**MVP (Current State - "SwishStats 1.0"):**
- [x] Single-player stat tracking.
- [x] AI game summary generation.
- [x] Game history and management.
- [x] Full offline capability (except for summary generation).
- [x] Data export to CSV.
- [x] Player personalization (name/photo).

**Idea Inbox (Potential Future Features - "The Bench"):**

- **Enhanced Stat Tracking:**
  - **Shot Chart:** A visual representation of the court where users can tap to mark shot locations (makes/misses). This would provide much richer data for the AI summary.
  - **Time Tracking:** Track player's "minutes played" by adding a game clock and substitution buttons.
  - **Plus/Minus (+/-):** Calculate the team's point differential while the player is on the court.

- **Multi-Player & Team Management:**
  - Ability to track stats for an entire team, not just one player.
  - Create and switch between multiple player profiles.
  - Generate team-level summaries and identify key contributors.

- **Improved AI Integration:**
  - **Custom Prompts:** Allow users to tweak the AI's personality (e.g., "Serious Coach," "Funny Analyst").
  - **Comparative Analysis:** Generate summaries that compare the current game's performance to the player's average or a previous game.
  - **Video Analysis (Long-term):** Allow users to upload game footage and have an AI model (like Gemini with video understanding) generate stats and insights automatically.

- **Data & User Experience:**
  - **Cloud Sync:** Allow users to create an account and sync their data across multiple devices.
  - **Advanced Data Visualization:** Display charts and graphs of a player's performance over a season.
  - **Sharing:** Add a "Share Summary" button that creates a visually appealing image of the stats and AI summary to share on social media.
  - **Accessibility Improvements:** Conduct a full a11y audit to ensure the app is usable by everyone.

**Next Up (Roadmap - "The Starting Lineup"):**

1.  **Shot Chart Integration:** This is the highest-impact next feature. It provides valuable data and is a common request for stat trackers.
2.  **Multi-Player Profiles:** Allow a user (e.g., a parent) to easily switch between tracking different children.
3.  **Cloud Sync & Accounts:** Move from `localStorage` to a simple cloud backend (like Firebase) to enable data backup and cross-device sync.
4.  **Enhanced Sharing:** Create a shareable summary card.
