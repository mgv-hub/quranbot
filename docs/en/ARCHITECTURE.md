# Architecture and Structure

## Design Philosophy

The project follows a modular monolithic architecture. Logic is separated into distinct domains including State, Data, Interactions, and Utils to facilitate maintenance. It utilizes custom path aliasing to manage deep directory structures.

## Folder Hierarchy

- core/bot/: Entry point and main client initialization.
- core/startup/: Bootstrap logic and command registration.
- core/state/: State management and persistence.
- core/interactions/: Handling buttons, menus, and commands.
- core/data/: Data fetching and caching.
- core/utils/: Shared utilities including logging and Firebase.
- core/ui/: Embed builders and component creators.
- core/package/Envira/: Custom environment variable loader.

## Main Components

- Client: Discord.js Client instance managed in core/bot/core.js.
- State Manager: GuildStateManager and PersistentStateManager handle runtime and database state.
- Interaction Processor: Routes all Discord interactions to specific handlers.
- Data Loader: Manages external API calls and caching for reciters and surahs.

## Module Interaction

The startup sequence initializes the client, loads data, connects to Firebase, and restores previous states. Interactions are routed through a central processor which validates permissions and cooldowns before executing specific handlers.
