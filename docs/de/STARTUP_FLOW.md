# Start- und Initialisierungs-Fluss

## Sequenz

1. Env-Laden: core/config/envSwitcher.js lädt Umgebungsvariablen.
2. Client-Init: core/startup/botSetup.js initialisiert Discord-Client und globale Variablen.
3. Daten-Laden: core/data/data-manager.js ruft Koran- und Rezitator-Daten ab.
4. Login: Bot meldet sich bei Discord an.
5. Ready-Event: core/startup/readyHandler.js wird ausgelöst.
   - Firebase initialisieren.
   - Runtime-Zustände wiederherstellen.
   - Sprachverbindungen wiederherstellen.
   - Befehle registrieren.
   - Timer starten (Azkar, Backups, Stats).

## Wiederkehrende Aufgaben

- Zustand speichern: Alle 60 Sekunden.
- Backup: Alle 5 Minuten.
- Radio-Gesundheit: Alle 30 Minuten.
- Speicher-Bereinigung: Alle 3 Minuten.
- Stats-Update: Alle 10 Sekunden.
