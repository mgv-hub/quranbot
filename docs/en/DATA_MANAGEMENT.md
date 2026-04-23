# Data Management

## Fetching

Located in core/data/.

- Sources: Data is fetched from mp3quran.net, aladhan.com, and custom JSON repositories.
- Methods: Uses node-fetch with custom headers and timeouts.
- Validation: Data structures are validated before being loaded into global state.

## Caching

- Runtime Cache: Data is stored in global variables for fast access.
- Firebase Cache: Critical data is backed up to Firebase for persistence.
- Local Cache: JSON files are used as a fallback if remote sources fail.

## Storage

- Firebase: Used for guild setups, states, control IDs, and user webhooks.
- Local: Backup files are compressed and stored locally before being sent to Discord channels.
- Environment: Sensitive configuration is loaded via custom Envira loader.
