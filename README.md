# QuranBot

## Overview
QuranBot is a production-ready Discord bot engineered to deliver a seamless, high-fidelity Quran listening experience. It integrates automated Azkar reminders, precise prayer time calculations, and live Islamic radio streaming within a robust, state-synchronized architecture.

## Key Features
- **Comprehensive Quran Playback:** Full access to 114 surahs with multiple verified reciters, seamless surah navigation, and continuous playback.
- **Islamic Radio Streaming:** Direct integration with official Quran radio stations, including health monitoring and automatic fallback.
- **Automated Azkar System:** Scheduled dhikr delivery with optional audio playback, image support, and configurable intervals.
- **Global Prayer Times:** Accurate daily prayer schedules for 35+ countries and major cities, powered by the Aladhan API with localized time formats.
- **Interactive Control Panel:** Dynamic embed-based interface featuring playback controls, reciter/surah selection, radio mode toggling, and permission management.
- **State Persistence & Recovery:** Dual-layer state management (runtime memory + Firebase synchronization) withgit automatic voice reconnection and crash recovery.
- **Optimized Architecture:** Memory management, interaction rate limiting, duplicate detection, retry logic, and multi-guild concurrent support.

## Commands
| Command | Description |
|---------|-------------|
| `/إعداد` | Initialize Quran category and required text/voice channels |
| `/دخول` | Join the pre-configured Quran voice channel |
| `/دخول_قناة` | Join a specific voice channel provided as an argument |
| `/خروج` | Disconnect from the active voice channel |
| `/تحكم` | Open the interactive control panel for playback and settings |
| `/مواقيت_الصلاة` | Display prayer times for selected countries and cities |
| `/دليل` | View comprehensive usage guide and feature overview |
| `/مصادر` | List official data sources and API references |
| `/سرعة` | Check bot latency, uptime, server count, and system metrics |

## Technology Stack
- **Runtime:** [Node.js (v22)](https://nodejs.org/en/download)
- **Framework:** [Discord.js v14](https://discord.js.org/docs/packages/discord.js/14.26.2)
- **Audio Engine:** @discordjs/voice, FFmpeg, Opus
- **Database:** [Firebase Realtime Database](https://firebase.google.com/)
- **Utilities:** Custom environment manager, path aliasing, health check endpoints, automated backup system

## Installation & Deployment

1. **Download the Repository**  
   Clone the repository to your local machine or server:
   ```bash
   git clone https://github.com/mgv-hub/quranbot.git
   cd quranbot
   ```

2. **Install Dependencies**  
   Install all required packages using pnpm:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**  
   - Locate the example environment files in your project directory:
     ```
     .env.example
     development.env.example
     production.env.example
     ```
   - **Important:** You must rename these files by removing the `.example` extension before use:
     ```bash
     # For enc 
     .env.example to .env

     # For development
     ren development.env.example to development.env

     # For production
     ren production.env.example to production.env
     ```
   - Additionally, ensure the main `.env` file exists and is properly configured.
   - Open the renamed file (`development.env` or `production.env`) and populate the required values:
     - `DISCORD_TOKEN`: Your bot token from the Discord Developer Portal
     - `CLIENT_ID`: Your application's client ID
     - Firebase configuration credentials (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.)
     - Optional: monitoring endpoints, backup channel IDs, and radio station URLs

4. **Set the Environment Mode**  
   - The project automatically selects the environment file based on `NODE_ENV`:

     ```env
     NODE_ENV=development
     ```
     → loads `development.env`

     ```env
     NODE_ENV=production
     ```
     → loads `production.env`

   - Make sure the correct file exists and is properly configured before starting the bot.

5. **Start the Bot**  
   Launch the application using the appropriate script:
   ```bash
   node --trace-warnings --trace-deprecation --trace-uncaught --trace-exit --enable-source-maps .
   ```

> **Note:** The `.example` extension serves as a template indicator. The application will not load configuration from files retaining this extension. Always ensure the active environment file has the exact name expected by the runtime (`development.env`, `production.env`, or `.env`).

## Architecture Highlights
- **State Management:** Synchronized runtime and persistent states with automatic recovery, manual disconnect flags, and scheduled Firebase sync.
- **Interaction Pipeline:** Centralized processor enforcing cooldowns, rate limits, duplicate suppression, and role-based authorization.
- **Audio Reliability:** Stream validation, byte-range calculation for seek operations, radio health checker with automatic fallback, and graceful error recovery.
- **Data Synchronization:** Local caching, Firebase persistence, automated backups with Discord channel delivery, and cleanup routines for orphaned guild data.

## Contributing
Contributions are welcome. Please open an issue before submitting substantial pull requests to discuss implementation details. Maintain existing naming conventions, avoid unnecessary abstractions, and ensure all changes are production-tested.

## License & Disclaimer
This project is open-source and provided as-is. Quranic audio and prayer time data are sourced from official public APIs (mp3quran.net, aladhan.com). Users are advised to verify prayer times with local religious authorities.

> نسأل الله أن يكون هذا العمل خالصا لوجهه الكريم، وأن ينفع به الجميع، وأن يجعلنا وإياكم من الذين يستمعون القول فيتبعون أحسنه.
```