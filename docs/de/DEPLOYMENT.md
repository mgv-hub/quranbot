# Bereitstellung und Konfiguration

## Umgebungsvariablen

- DISCORD_TOKEN: Bot-Authentifizierungs-Token.
- FIREBASE_CONFIG: Datenbank-Anmeldedaten.
- SPE_USER_ID: Spezielle Entwickler-Benutzer-IDs.
- NODE_ENV: Produktions- oder Entwicklungsmodus.

## Start-Skripte

- start.bat: Windows-Startskript.
- start.sh: Linux-Startskript.
- Paket-Manager: Verwendet pnpm für Abhängigkeitsverwaltung.

## Überwachung

- Gesundheitsprüfung: HTTP-Endpunkt für Status.
- Logging: Dateibasiert mit Rotation und Archivierung.
- Statistiken: Nutzungsmetriken in Firebase verfolgt.

## Backup-System

- Lokal: Komprimierte JSON-Dateien lokal gespeichert.
- Remote: Über Webhook an Discord-Kanal gesendet.
- Zeitplan: Läuft alle 5 Minuten automatisch.

## Skalierung

- Speicher: Für Einzel-Instanz-Bereitstellung optimiert.
- Datenbank: Firebase für gemeinsamen Zustand verwendet.
