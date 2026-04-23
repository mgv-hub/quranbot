# Interaction Handlers

## Processors

Located in core/interactions/.

- interactionProcessor.js: Main router for all interactions.
- proc-buttons.js: Routes button clicks to specific logic files.
- proc-menus.js: Handles select menu interactions.
- proc-modals.js: Processes modal submissions.
- proc-commands.js: Executes slash commands.

## System Logic

- Voice State: Checks if the bot is in a voice channel before allowing playback commands.
- Authorization: Validates user permissions before executing sensitive actions.
- Cooldowns: Enforces rate limiting to prevent abuse.
- Error Handling: Centralized error catching with user-friendly messages.

## Specific Handlers

- Playback: Play, pause, resume, next, previous.
- Navigation: Pagination for Surah lists and Reciter lists.
- Admin: Developer-only controls for server management and statistics.
- Webhooks: Registration and management of external webhook Azkar services.
