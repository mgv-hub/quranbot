# Architektur und Struktur

## Design-Philosophie

Das Projekt folgt einer modularen monolithischen Architektur. Die Logik ist in separate Domänen unterteilt, einschließlich State, Data, Interactions und Utils, um die Wartung zu erleichtern. Es verwendet benutzerdefinierte Pfad-Aliasing zur Verwaltung tiefer Verzeichnisstrukturen.

## Ordner-Hierarchie

- core/bot/: Einstiegspunkt und Haupt-Client-Initialisierung.
- core/startup/: Bootstrap-Logik und Befehlsregistrierung.
- core/state/: Zustandsverwaltung und Beständigkeit.
- core/interactions/: Verarbeitung von Buttons, Menüs und Befehlen.
- core/data/: Datenabruf und Caching.
- core/utils/: Gemeinsame Utilities einschließlich Logging und Firebase.
- core/ui/: Embed-Ersteller und Komponenten-Ersteller.
- core/package/Envira/: Benutzerdefinierter Umgebungsvariablen-Loader.

## Hauptkomponenten

- Client: Discord.js Client-Instanz, verwaltet in core/bot/core.js.
- State Manager: GuildStateManager und PersistentStateManager verarbeiten Runtime- und Datenbank-Zustand.
- Interaction Processor: Leitet alle Discord-Interaktionen an spezifische Handler weiter.
- Data Loader: Verwaltet externe API-Aufrufe und Caching für Rezitatoren und Suren.

## Modul-Interaktion

Die Startsequenz initialisiert den Client, lädt Daten, verbindet sich mit Firebase und stellt vorherige Zustände wieder her. Interaktionen werden über einen zentralen Prozessor geleitet, der Berechtigungen und Cooldowns validiert, bevor spezifische Handler ausgeführt werden.
