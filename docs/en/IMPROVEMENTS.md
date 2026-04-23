# Potential Improvements

## Scaling

- Database: Migrate from Firebase Realtime Database to Firestore or PostgreSQL for complex queries.
- Redis: Use Redis for shared state across multiple bot instances.

## Security

- Secrets: Ensure all API keys are encrypted and rotated regularly.
- Input Validation: Strengthen validation on modal inputs and command arguments.
- Rate Limiting: Implement stricter global rate limits to prevent API bans.

## Memory Optimization

- Cache Limits: Enforce stricter limits on interaction and embed caches.
- Stream Management: Ensure audio resources are destroyed immediately after use.
- Event Listeners: Audit event listeners to prevent memory leaks.

## Code Refactoring

- Dependency Injection: Replace global variables with injected dependencies for better testability.
- TypeScript: Migrate to TypeScript for type safety.
- Unit Tests: Add Jest tests for utility functions and state logic.
