# Zustandsverwaltung

## Gilde-Zustand

Jede Gilde hat ein Runtime-Zustandsobjekt, das im Speicher gespeichert ist.

- Verbindung: Sprachverbindungsobjekt.
- Wiedergabe: Aktuelle Sure, Rezitator und Modus.
- Timer: Azkar- und Inaktivitäts-Timer.
- Konfiguration: Steuerungsmodus und Kanal-IDs.

## Persistenter Zustand

Der Zustand wird mit Firebase Realtime Database synchronisiert.

- Wiederherstellung: Zustände werden beim Bot-Neustart wiederhergestellt.
- Backup: Automatisches Backup alle 5 Minuten.
- Bereinigung: Veraltete Daten für verlassene Gilden entfernt.

## Zustandswiederherstellung

1. Zustände von Firebase laden.
2. Kanal-Existenz validieren.
3. Sprachkanäle erneut verbinden.
4. Wiedergabe falls zutreffend fortsetzen.

## Speicherverwaltung

- Garbage Collection bei hoher Speichernutzung ausgelöst.
- Interaktion-Cache regelmäßig gelöscht.
- Zerstörte Verbindungen automatisch bereinigt.
