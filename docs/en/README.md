# QuranBot Project Documentation

## Overview

QuranBot is a comprehensive Node.js application designed for the Discord platform. Its primary purpose is to provide Islamic content services including Quran recitation, radio streaming, Azkar automation, and prayer time information. The project is engineered for high availability, state persistence, and modular scalability.

## Target Audience

- Discord Server Administrators seeking Islamic content automation.
- Developers interested in modular Discord bot architecture.
- End users requiring reliable audio streaming and religious utilities.

## Main Features

- Audio Playback: Streaming Quran recitations from multiple reciters and radio stations.
- State Persistence: Saving and restoring server configurations via Firebase.
- Automated Azkar: Scheduled sending of remembrance messages.
- Prayer Times: Global prayer time lookup with location-based accuracy.
- Admin Controls: Dedicated developer panel for server management.
- Recovery Systems: Automatic reconnection to voice channels after restarts.

## Installation

1. Clone the repository.
2. Install dependencies using pnpm install.
3. Configure environment variables in .env.
4. Start the bot using pnpm start.

## License

MIT License
