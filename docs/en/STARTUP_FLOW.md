# Startup and Initialization Flow

## Sequence

1. Env Loading: core/config/envSwitcher.js loads environment variables.
2. Client Init: core/startup/botSetup.js initializes Discord client and global variables.
3. Data Load: core/data/data-manager.js fetches Quran and Reciter data.
4. Login: Bot logs into Discord.
5. Ready Event: core/startup/readyHandler.js triggers.
   - Initialize Firebase.
   - Restore Runtime States.
   - Recover Voice Connections.
   - Register Commands.
   - Start Timers (Azkar, Backups, Stats).

## Recurring Tasks

- State Save: Every 60 seconds.
- Backup: Every 5 minutes.
- Radio Health: Every 30 minutes.
- Memory Cleanup: Every 3 minutes.
- Stats Update: Every 10 seconds.
