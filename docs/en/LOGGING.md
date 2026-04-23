# Logging and Monitoring

## Strategy

- Async Queue: Prevents I/O blocking during high traffic.
- Archiving: Old logs are compressed and stored in storage/logs/archive.
- Cleanup: Logs older than 60 days are automatically deleted.
- Error Tracking: Uncaught exceptions and promise rejections are logged with stack traces.

## Monitoring

- Health Check: HTTP server exposes /health and /radio-health endpoints.
- Memory Management: Periodic checks trigger garbage collection if memory usage exceeds thresholds.
- Statistics: Bot usage stats (servers, commands, azkar) are tracked and saved to Firebase.

## Log Levels

- debug: Detailed internal information.
- info: General operational messages.
- warn: Potential issues.
- error: Critical failures.
- fatal: System stopping errors.
