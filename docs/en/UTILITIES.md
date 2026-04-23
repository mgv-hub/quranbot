# Custom Utilities

## Envira Loader

Located in core/package/Envira/.

- Purpose: Custom alternative to dotenv with encryption support.
- Features: Parses .env files, supports encrypted values, handles multiple environments.

## Path Aliasing

- Library: pathlra-aliaser.
- Usage: Allows imports like @logger instead of relative paths.
- Configuration: Defined in package.json under path*aliaser*.

## Audio Utils

- Retry Logic: fetchWithRetry handles network instability.
- Stream Validation: Checks content-type and status before playing.
- Duration Calculation: Estimates audio duration for progress tracking.

## Database Cleaner

Located in core/utils/databaseCleaner.js.

- Function: Removes stale data for guilds the bot is no longer in.
- Targets: Setup guilds, guild states, and control IDs.
