# Interaktions-Handler

## Prozessoren

Befinden sich in core/interactions/.

- interactionProcessor.js: Haupt-Router für alle Interaktionen.
- proc-buttons.js: Leitet Button-Klicks an spezifische Logik-Dateien weiter.
- proc-menus.js: Verarbeitet Select-Menü-Interaktionen.
- proc-modals.js: Verarbeitet Modal-Übermittlungen.
- proc-commands.js: Führt Slash-Befehle aus.

## System-Logik

- Sprachzustand: Prüft, ob Bot im Sprachkanal ist, bevor Wiedergabe-Befehle erlaubt werden.
- Autorisierung: Validiert Benutzerberechtigungen vor Ausführung sensibler Aktionen.
- Cooldowns: Erzwingt Rate-Limiting, um Missbrauch zu verhindern.
- Fehlerbehandlung: Zentralisierte Fehlererfassung mit benutzerfreundlichen Nachrichten.

## Spezifische Handler

- Wiedergabe: Play, Pause, Resume, Next, Previous.
- Navigation: Paginierung für Suren-Listen und Rezitator-Listen.
- Admin: Nur-Entwickler-Steuerung für Server-Verwaltung und Statistiken.
- Webhooks: Registrierung und Verwaltung externer Webhook-Azkar-Dienste.
