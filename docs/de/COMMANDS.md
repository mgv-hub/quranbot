# Befehlssystem

## Slash-Befehle

- /control: Zeigt das Hauptsteuerungspanel für Wiedergabe an.
- /setup: Erstellt die Koran-Kategorie und Kanäle.
- /join: Tritt dem konfigurierten Sprachkanal bei.
- /leave: Trennt vom Sprachkanal.
- /ping: Zeigt Bot-Latenz und Statistiken an.
- /prayer_times: Zeigt Gebetszeiten für ausgewählte Standorte an.
- /sources: Listet vom Bot verwendete Datenquellen auf.
- /guide: Zeigt Nutzungsanweisungen an.

## Berechtigungsebenen

- Administrator: Vollzugriff auf alle Befehle.
- Spezielle Benutzer: In Umgebungsvariablen definiert.
- Alle: Beschränkt auf Wiedergabe-Navigation in bestimmten Modi.

## Cooldowns

Befehle verwenden ein Cooldown-System, um Missbrauch zu verhindern.

- Benutzer-Cooldowns: Pro Benutzer pro Befehl angewendet.
- Server-Cooldowns: Pro Gilde für Setup-Befehle angewendet.
- Globale Cooldowns: Während hoher Last-Situationen angewendet.

## Ausführungsfluss

1. Interaktion erhalten.
2. Berechtigungsprüfung.
3. Cooldown-Prüfung.
4. Befehlsausführung.
5. Zustandsaktualisierung.
