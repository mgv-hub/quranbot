# QuranBot

## Overview

QuranBot is a production-ready Discord bot engineered to deliver a seamless, high-fidelity Quran listening experience. It integrates automated Azkar reminders, precise prayer time calculations, and live Islamic radio streaming within a robust, state-synchronized architecture.

## Key Features

- **Comprehensive Quran Playback:** Full access to 114 surahs with multiple verified reciters, seamless surah navigation, and continuous playback.
- **Islamic Radio Streaming:** Direct integration with official Quran radio stations, including health monitoring and automatic fallback.
- **Automated Azkar System:** Scheduled dhikr delivery with optional audio playback, image support, and configurable intervals.
- **Global Prayer Times:** Accurate daily prayer schedules for 35+ countries and major cities, powered by the Aladhan API with localized time formats.
- **Interactive Control Panel:** Dynamic embed-based interface featuring playback controls, reciter/surah selection, radio mode toggling, and permission management.
- **State Persistence & Recovery:** Dual-layer state management (runtime memory + Firebase synchronization) with automatic voice reconnection and crash recovery.
- **Optimized Architecture:** Memory management, interaction rate limiting, duplicate detection, retry logic, and multi-guild concurrent support.

## Commands

| Command          | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `/إعداد`         | Initialize Quran category and required text/voice channels   |
| `/دخول`          | Join the pre-configured Quran voice channel                  |
| `/دخول_قناة`     | Join a specific voice channel provided as an argument        |
| `/خروج`          | Disconnect from the active voice channel                     |
| `/تحكم`          | Open the interactive control panel for playback and settings |
| `/مواقيت_الصلاة` | Display prayer times for selected countries and cities       |
| `/دليل`          | View comprehensive usage guide and feature overview          |
| `/مصادر`         | List official data sources and API references                |
| `/سرعة`          | Check bot latency, uptime, server count, and system metrics  |

## Technology Stack

- **Runtime:** [Node.js v22](https://nodejs.org/en/download) **(Required - Other versions not supported)**
- **Framework:** [Discord.js v14](https://discord.js.org/docs/packages/discord.js/14.26.2)
- **Audio Engine:** @discordjs/voice, FFmpeg, Opus
- **Database:** [Firebase Realtime Database](https://firebase.google.com/)
- **Utilities:** Custom environment manager, path aliasing, health check endpoints, automated backup system

## System Requirements

> **Node.js Version Requirement**
>
> This project requires **Node.js v22.x** exclusively. Other versions (v18, v20, v23+) are not supported and may cause runtime errors, compatibility issues, or unexpected behavior.
>
> ```bash
> # Verify your Node.js version
> node -v
> # Expected output: v22.x.x
> ```
>
> To install Node.js v22:
>
> - **Windows/macOS:** Download from [nodejs.org](https://nodejs.org/en/download)
> - **Linux (nvm):** `nvm install 22 && nvm use 22`
> - **Linux (apt):** Follow official NodeSource setup for v22

## Installation & Deployment

1. **Download the Repository**  
   Clone the repository to your local machine or server:

   ```bash
   git clone https://github.com/mgv-hub/quranbot.git
   cd quranbot
   ```

2. **Verify Node.js Version**  
   Ensure you are running Node.js v22:

   ```bash
   node -v  # Must output v22.x.x
   ```

3. **Install Dependencies**  
   Install all required packages using pnpm:

   ```bash
   pnpm install
   ```

4. **Configure Environment Variables**
   - Locate the example environment files in your project directory:
      ```
      .env.example
      development.env.example
      production.env.example
      ```
   - **Important:** You must rename these files by removing the `.example` extension before use:

      ```bash
      # For env
      ren .env.example .env

      # For development
      ren development.env.example development.env

      # For production
      ren production.env.example production.env
      ```

   - Additionally, ensure the main `.env` file exists and is properly configured.
   - Open the renamed file (`development.env` or `production.env`) and populate the required values:
      - `DISCORD_TOKEN`: Your bot token from the Discord Developer Portal
      - `CLIENT_ID`: Your application's client ID
      - Firebase configuration credentials (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.)
      - Optional: monitoring endpoints, backup channel IDs, and radio station URLs

5. **Set the Environment Mode**
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

6. **Start the Bot**  
   Launch the application using the appropriate script:
   ```bash
   node --trace-warnings --trace-deprecation --trace-uncaught --trace-exit --enable-source-maps .
   ```

> **Note:** The `.example` extension serves as a template indicator. The application will not load configuration from files retaining this extension. Always ensure the active environment file has the exact name expected by the runtime (`development.env`, `production.env`, or `.env`).

---

## Firebase Configuration Guide

### Getting Firebase Admin SDK Credentials (Service Account)

The bot uses **Firebase Admin SDK** for server-side operations, which requires service account credentials instead of the public Client SDK keys.

#### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/
   - Select your project

2. **Access Service Accounts**
   - Click the gear icon → **Project settings**
   - Go to the **Service accounts** tab
   - Under **Firebase Admin SDK**, click **Generate new private key**

3. **Download the JSON Key File**
   - A warning will appear: "Keep this file secret!"
   - Click **Generate key** to download the JSON key file

4. **Extract Values for Environment Variables**
   Open the downloaded JSON file and copy these values to your `development.env` or `production.env`:

   ```env
   # Firebase Admin SDK Service Account Credentials (EXAMPLE VALUES REPLACE WITH YOUR OWN)
   FIREBASE_ADMIN_TYPE=service_account
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_PRIVATE_KEY_ID=your_private_key_id_here
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKc...\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_ADMIN_CLIENT_ID=your_client_id_here
   FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
   ```

   > **Important Notes:**
   >
   > - The `FIREBASE_ADMIN_PRIVATE_KEY` contains newlines (`\n`). Keep them escaped as shown above.
   > - Wrap the private key value in double quotes to preserve formatting.
   > - Never commit this file to version control. Add it to `.gitignore`:
   >    ```bash
   >    echo "*.json" >> .gitignore
   >    echo "development.env" >> .gitignore
   >    echo "production.env" >> .gitignore
   >    ```
   > - **Never share your private key or service account credentials with anyone.**

### Firebase Security Rules

The bot is designed to work with **strict security rules** that deny all public access. Only authenticated Admin SDK requests can read/write data.

#### Current Recommended Rules:

```json
{
   "rules": {
      ".read": true,
      ".write": true
   }
}
```

#### How to Apply These Rules:

1. Go to your Firebase Console → Realtime Database → Rules
2. Replace the existing rules with the JSON above
3. Click **Publish**

#### Why These Rules Work:

| Rule Setting    | Effect                                                    |
| --------------- | --------------------------------------------------------- |
| `.read: false`  | Denies all client-side read access                        |
| `.write: false` | Denies all client-side write access                       |
| Admin SDK       | Bypasses rules automatically (server-side authentication) |

> The bot uses `firebase-admin` with service account credentials, which authenticates as a privileged server and bypasses these rules. Client apps (web/mobile) cannot access your data even if they have your public API keys.

---

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
