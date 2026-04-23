# Datenverwaltung

## Abruf

Befindet sich in core/data/.

- Quellen: Daten werden von mp3quran.net, aladhan.com und benutzerdefinierten JSON-Repositories abgerufen.
- Methoden: Verwendet node-fetch mit benutzerdefinierten Headern und Timeouts.
- Validierung: Datenstrukturen werden validiert, bevor sie in globalen Zustand geladen werden.

## Caching

- Runtime-Cache: Daten in globalen Variablen für schnellen Zugriff gespeichert.
- Firebase-Cache: Kritische Daten für Beständigkeit in Firebase gesichert.
- Lokaler Cache: JSON-Dateien als Fallback verwendet, wenn Remote-Quellen fehlschlagen.

## Speicherung

- Firebase: Verwendet für Gilde-Setups, Zustände, Steuerungs-IDs und Benutzer-Webhooks.
- Lokal: Backup-Dateien komprimiert und lokal gespeichert, bevor sie an Discord-Kanäle gesendet werden.
- Umgebung: Sensible Konfiguration über benutzerdefinierten Envira-Loader geladen.
