# QuranBot Projektdokumentation

## Überblick

QuranBot ist eine umfassende Node.js-Anwendung, die für die Discord-Plattform entwickelt wurde. Ihr Hauptzweck ist die Bereitstellung islamischer Inhaltsdienste, einschließlich Koran-Rezitation, Radio-Streaming, Azkar-Automatisierung und Gebetszeitinformationen. Das Projekt ist für hohe Verfügbarkeit, Zustandsbeständigkeit und modulare Skalierbarkeit ausgelegt.

## Zielgruppe

- Discord-Server-Administratoren, die islamische Inhaltsautomatisierung suchen.
- Entwickler, die an modularer Discord-Bot-Architektur interessiert sind.
- Endbenutzer, die zuverlässiges Audio-Streaming und religiöse Utilities benötigen.

## Hauptfunktionen

- Audio-Wiedergabe: Streaming von Koran-Rezitationen von mehreren Rezitatoren und Radiosendern.
- Zustandsbeständigkeit: Speichern und Wiederherstellen von Server-Konfigurationen über Firebase.
- Automatisierte Azkar: Geplantes Senden von Erinnerungs-Nachrichten.
- Gebetszeiten: Globale Gebetszeit-Suche mit standortbasierter Genauigkeit.
- Admin-Steuerung: Dediziertes Entwickler-Panel für Server-Verwaltung.
- Wiederherstellungssysteme: Automatische Wiederverbindung zu Sprachkanälen nach Neustarts.

## Installation

1. Repository klonen.
2. Abhängigkeiten mit pnpm install installieren.
3. Umgebungsvariablen in .env konfigurieren.
4. Bot mit pnpm start starten.

## Lizenz

MIT-Lizenz
