# Audiosystem

## Wiedergabe-Engine

Verwendet @discordjs/voice für Audio-Verarbeitung.

- Ressourcen: Aus HTTP-Streams erstellt.
- Player: Verwaltet Wiedergabezustand und Fehler.
- Verbindung: Verarbeitet Sprach-Gateway-Kommunikation.

## Stream-Verarbeitung

- Validierung: URLs vor Wiedergabe geprüft.
- Wiederholungslogik: Fehlgeschlagene Streams mit Fallbacks erneut versucht.
- Dauer: Aus Headern oder Suren-Nummer geschätzt.

## Rezitator-Daten

- Quellen: mp3quran.net und benutzerdefinierte JSON-Repositories.
- Caching: Daten im Speicher und Firebase gecacht.
- Fallback: Lokale Dateien verwendet, wenn Remote-Quellen fehlschlagen.

# Radiosystem

- Gesundheitsprüfung: Streams regelmäßig überwacht.
- Failover: Automatischer Wechsel zu funktionierenden Streams.
- Paginierung: Radios in Seiten von 25 aufgelistet.
