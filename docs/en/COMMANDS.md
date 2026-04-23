# Command System

## Slash Commands

- /control: Displays the main control panel for playback.
- /setup: Creates the Quran category and channels.
- /join: Joins the configured voice channel.
- /leave: Disconnects from the voice channel.
- /ping: Displays bot latency and statistics.
- /prayer_times: Shows prayer times for selected locations.
- /sources: Lists data sources used by the bot.
- /guide: Displays usage instructions.

## Permission Levels

- Administrator: Full access to all commands.
- Special Users: Defined in environment variables.
- Everyone: Limited to playback navigation in specific modes.

## Cooldowns

Commands utilize a cooldown system to prevent abuse.

- User Cooldowns: Applied per user per command.
- Server Cooldowns: Applied per guild for setup commands.
- Global Cooldowns: Applied during high load situations.

## Execution Flow

1. Interaction received.
2. Permission check.
3. Cooldown check.
4. Command execution.
5. State update.
