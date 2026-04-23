# State Management

## Guild State

Each guild has a runtime state object stored in memory.

- Connection: Voice connection object.
- Playback: Current surah, reciter, and mode.
- Timers: Azkar and inactivity timers.
- Configuration: Control mode and channel IDs.

## Persistent State

State is synchronized with Firebase Realtime Database.

- Recovery: States are restored on bot restart.
- Backup: Automated backups every 5 minutes.
- Cleanup: Stale data removed for left guilds.

## State Restoration

1. Load states from Firebase.
2. Validate channel existence.
3. Reconnect voice channels.
4. Resume playback if applicable.

## Memory Management

- Garbage collection triggered on high memory usage.
- Interaction cache cleared periodically.
- Destroyed connections cleaned up automatically.
