# Audio System

## Playback Engine

Uses @discordjs/voice for audio handling.

- Resources: Created from HTTP streams.
- Player: Manages playback state and errors.
- Connection: Handles voice gateway communication.

## Stream Handling

- Validation: URLs checked before playback.
- Retry Logic: Failed streams retried with fallbacks.
- Duration: Estimated from headers or surah number.

## Reciter Data

- Sources: mp3quran.net and custom JSON repositories.
- Caching: Data cached in memory and Firebase.
- Fallback: Local files used if remote sources fail.

## Radio System

- Health Check: Streams monitored periodically.
- Failover: Automatic switch to working streams.
- Pagination: Radios listed in pages of 25.
