# Deployment and Configuration

## Environment Variables

- DISCORD_TOKEN: Bot authentication token.
- FIREBASE_CONFIG: Database credentials.
- SPE_USER_ID: Special developer user IDs.
- NODE_ENV: Production or development mode.

## Startup Scripts

- start.bat: Windows startup script.
- start.sh: Linux startup script.
- Package Manager: Uses pnpm for dependency management.

## Monitoring

- Health Check: HTTP endpoint for status.
- Logging: File-based with rotation and archiving.
- Statistics: Usage metrics tracked in Firebase.

## Backup System

- Local: Compressed JSON files stored locally.
- Remote: Sent to Discord channel via webhook.
- Schedule: Runs every 5 minutes automatically.

## Scaling

- Memory: Optimized for single-instance deployment.
- Database: Firebase used for shared state.
