# Benutzerdefinierte Utilities

## Envira-Loader

Befindet sich in core/package/Envira/.

- Zweck: Benutzerdefinierte Alternative zu dotenv mit Verschlüsselungsunterstützung.
- Funktionen: Parst .env-Dateien, unterstützt verschlüsselte Werte, verarbeitet mehrere Umgebungen.

## Pfad-Aliasing

- Bibliothek: pathlra-aliaser.
- Verwendung: Ermöglicht Imports wie @logger statt relativer Pfade.
- Konfiguration: In package.json unter path*aliaser* definiert.

## Audio-Utilities

- Wiederholungslogik: fetchWithRetry verarbeitet Netzwerk-Instabilität.
- Stream-Validierung: Prüft Content-Type und Status vor Wiedergabe.
- Dauer-Berechnung: Schätzt Audio-Dauer für Fortschrittsverfolgung.

## Datenbank-Bereiniger

Befindet sich in core/utils/databaseCleaner.js.

- Funktion: Entfernt veraltete Daten für Gilden, in denen der Bot nicht mehr ist.
- Ziele: Setup-Gilden, Gilde-Zustände und Steuerungs-IDs.
