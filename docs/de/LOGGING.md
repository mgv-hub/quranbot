# Logging und Überwachung

## Strategie

- Asynchrone Warteschlange: Verhindert I/O-Blockierung während hohem Traffic.
- Archivierung: Alte Logs komprimiert und in storage/logs/archive gespeichert.
- Bereinigung: Logs älter als 60 Tage automatisch gelöscht.
- Fehlerverfolgung: Nicht gefangene Ausnahmen und Promise-Ablehnungen mit Stack-Traces protokolliert.

## Überwachung

- Gesundheitsprüfung: HTTP-Server stellt /health und /radio-health Endpunkte bereit.
- Speicherverwaltung: Regelmäßige Prüfungen lösen Garbage Collection aus, wenn Speichernutzung Schwellenwerte überschreitet.
- Statistiken: Bot-Nutzungsstatistiken (Server, Befehle, Azkar) verfolgt und in Firebase gespeichert.

## Log-Level

- debug: Detaillierte interne Informationen.
- info: Allgemeine operative Nachrichten.
- warn: Potenzielle Probleme.
- error: Kritische Fehler.
- fatal: System-stoppende Fehler.
