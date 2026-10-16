# AuriMon – intensive Kontrolle aller 50 Gebiete

**Prüfdatum:** 17.10.2026  
**Android-Releasestand:** v1.4.25 (Code 163), unverändert  
**Geprüfter Entwicklungsstand:** GitHub `main` nach Karten-, Gebäude- und Smartphone-Korrekturen  
**Ergebnis:** Automatisierte Prüfungen bestanden, keine offenen Fehler im abschließenden Testlauf.

## Testumfang

| Prüfung | Ergebnis |
|---|---|
| 50 einzelne Ebenen in echtem Chromium gezeichnet, Farbinhalt geprüft | 50/50 bestanden |
| Osten-/Westen-Portale real durchgespielt, mit zulässigen Orden/Runen | 49/49 jeweils hin und zurück |
| Dungeons: falsche Reihenfolge abgewiesen, drei Runen aktiviert, Tor durchquert | 10/10 bestanden |
| Arenengebäude per Interaktion betreten | 10/10 bestanden |
| Regionalen Auftraggeber durch echte Spielfigur-Interaktion angesprochen | 10/10 bestanden |
| Doppelt belegte NPC-/Runen-/Gebäudefelder | Keine |
| Exakt gleiche Kachelkarten | Keine (50 unterschiedliche Layouts) |
| Ausgang/Quest-NPCs bei nicht passierbaren Gegenständen erreichbar | Bestanden |
| Browser-Darstellung bei 390px, 768px, 1440px | Bestanden |
| Profil speichern, Seite laden, Profil auswählen, Fortschritt kontrollieren | Bestanden |
| JavaScript-Seitenfehler beim abschließenden Chromium-Lauf | Keine |

## Regionen (fünf Karten je Region)

1. **Sonnenwiese** (1–5) – Dorf, Lichtung, Bach, Wurzelruine, Sonnenarena
2. **Mondsee** (6–10) – Seedorf, Schilf, Stege, Versunkene Bibliothek, Mondarena
3. **Felsenwald** (11–15) – Steige, Bergwerksdungeon und Gipfelarena
4. **Blumenpfad** (16–20) – Wiesen, Windmühlen und Blütenarena
5. **Windküste** (21–25) – Hafen, Strand, Grotten und Sturmarena
6. **Bernsteinwald** (26–30) – Lichtung, Pilzwald, Tempel und Waldarena
7. **Flüsterdorf** (31–35) – Nebel, Geisterbrunnen und Schattenarena
8. **Kristallsee** (36–40) – Schimmerufer, Frostpass und Kristallarena
9. **Vulkanpass** (41–45) – Glutpfad, Basalt und Flammenarena
10. **Wolkenhöhe** (46–50) – Wolkenstege, Himmelstempel und Kronenarena

## Aufgedeckte und behobene Fehler

- **Mondsee Ebene 6:** Arzt und Schatztruhe sowie Reiseführerin und Auftraggeber standen jeweils auf identischen Feldern. Quest und Truhe waren so praktisch nicht einzeln ansprechbar. Figuren getrennt platziert; automatischer Überschneidungsschutz ergänzt.
- **Ab Felsenwald:** Der Gebäuderenderer kannte die neue `atelier`-Werkstatt nicht. Das führte beim Öffnen betroffener Karten zu JavaScript-Fehlern. Eigene Dachfarben und sichere Grafik-Fallbacks ergänzt.
- **Smartphone-Hochformat:** Alte Tablet-Aufteilung quetschte die Karte bei 390px auf rund 87px. Kartenbereich/Steuerung werden beim 50-Ebenen-Renderer jetzt untereinander angeordnet.
- **Speichertest:** Nach Browserneustart muss das vorhandene Profil erst gewählt werden. Der Test wurde diesem echten App-Ablauf angepasst und besteht.

## Grenzen / Qualitätsbewertung

Das ist eine **technisch sorgfältig getestete Entwicklungsfassung** und noch keine vollständige Bestätigung der Spielqualität.

- Die 50 Karten wurden einzeln gerendert, die wichtigsten Interaktionen und Puzzles ausgeführt. **Nicht** jeder Kampf, jedes Item und sämtliche Nebenquests wurden über hunderte Spielzüge manuell beendet.
- Die Grundmechanik der späteren Regionen verwendet mehrere wiederkehrende Kartengeneratoren und Runenabläufe. Obwohl kein Kachelplan mehr identisch ist, sind **Spielerlebnis, individuelle Gestaltung und langfristige Abwechslung noch verbesserungswürdig**.
- Die Grafik ist weiterhin keine durchgängig individuell gestaltete 2,5D-Welt wie die freigegebene Referenz.
- Die Prüfungen liefen in Chromium mit einem isolierten Testprofil; ein erneuter physischer Android-Gerätetest fehlt.
- Keine neue APK wurde durch diese Kontrolle veröffentlicht. Die Fixes sind in `main`; **v1.4.25 bleibt weiterhin der letzte signierte Android-Release**.

## Originale Prüfergebnisse

[Erfolgreicher GitHub-Actions-Lauf](https://github.com/christiansuttmer-wq/AuriMon-Updates/actions/runs/38979794320)  
[Prüfarchiv mit 10 echten Regionenscreenshots, Übersicht und JSON-Berichten](https://github.com/christiansuttmer-wq/AuriMon-Updates/actions/runs/38979794320/artifacts/12080228421)
