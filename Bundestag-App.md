---
tags: [app-idee, privat]
status: in Umsetzung (Phase 0 abgeschlossen, Phase 1 als nächstes)
erstellt: 2026-07-25
aktualisiert: 2026-07-30
projektname: Bundestag-Kompakt
---

# Bundestag-App — Bundestag-Kompakt

## Idee
Kompakte, persönliche Zusammenfassung dessen, was im **Deutschen Bundestag** (nicht Länderebene) beschlossen wird bzw. bei großen laufenden Themen passiert – in einfacher Sprache, damit man ohne viel Nachrichtenkonsum mitbekommt, was politisch passiert.

**Wichtig – bewusst klein gehalten:** Kein Nachbau der offiziellen Bundestag-App (kein Live-Stream, kein Chat mit Abgeordneten, keine Mehrsprachigkeit etc. – das war eine KI-generierte Wunschliste, die verworfen wurde). Fokus bleibt: kompakte Zusammenfassung.

## Bisher festgelegt (aus grill-me-Interview, 2026-07-28)

**Umfang/Scope:**
- Nur Bundestag (nicht Bundesrat/Länder-Landtage) — eigenes, einfacheres System
- Sowohl **fertige Beschlüsse** als auch **Fortschritt bei großen laufenden Themen** (z.B. Haushalt, Rente über mehrere Monate)
- Rhythmus: **nach Sitzungstagen** (Bundestag tagt in Sitzungswochen, meist Mi-Fr), nicht ein starrer "alle 2 Tage"-Takt — bei mehr Ereignissen auch mehr Updates

**Inhalt pro Eintrag** (aus Bürger-Perspektive erarbeitet):
1. Titel in verständlicher Sprache (nicht der sperrige Gesetzestitel)
2. Zusammenfassung in einfacher Sprache — darf **ruhig länger als 4-5 Sätze** sein, wenn's der Inhalt braucht
3. Abstimmungsergebnis — **strukturiert in eigenen Gliederungspunkten** statt Fließtext, für schnelle Erfassbarkeit:
   - **Art:** (z.B. Handzeichen / namentliche Abstimmung / Ausschuss-Empfehlung)
   - **Dafür:** Parteien (bzw. genaue Kopfzahlen falls verfügbar, siehe Datenquellen unten)
   - **Dagegen:** Parteien
   - **Enthalten:** Parteien
4. Wer hat's eingebracht (Regierung/Fraktion)
5. Themenbereich (Kategorie: Gesundheit, Wirtschaft, Umwelt, Soziales, etc.)
6. Nächste Schritte (z.B. "muss noch durch Bundesrat")

**Datenquellen (recherchiert):**
- **DIP** (`dip.bundestag.de`) — offizielle API von Bundestag/Bundesrat selbst, liefert rohe Fakten (Status, Titel, wer eingebracht), aber **keine** fertigen Zusammenfassungen
- **bundestag.de/parlament/plenum/abstimmung** — offizielle Abstimmungsergebnisse mit Partei-Aufschlüsselung, aber **nur bei "namentlichen Abstimmungen"** (nicht bei jedem Beschluss — die meisten laufen als einfaches Handzeichen ohne Einzelerfassung)
- **bundestagszusammenfasser.de** — bereits bestehende, unabhängige (nicht-offizielle) Seite mit umfassendem Tracking (Referentenentwürfe, Kabinettsbeschlüsse, Bundesrat, Lobbyregister, wöchentlicher Newsletter). Zu umfangreich/unübersichtlich für unseren Zweck, aber **gute Datenbasis** — wir bauen unsere eigene Verdichtungsstufe (kompakte Zusammenfassung) obendrauf, statt von Grund auf selbst zu scrapen

**Design:**
- 3 Farbvarianten erstellt und verglichen: A) Navy/Slate (sachlich), B) Teal (frisch), C) Indigo (modern-verspielt) → **Entscheidung: Design A (Navy/Slate)**
- Struktur: **Themen-gruppierte Liste** (nach Kategorie sortiert, nicht chronologisch) als Hauptansicht + **Detailansicht** beim Antippen eines Eintrags (mit voller Zusammenfassung, Abstimmungsergebnis, nächsten Schritten, Quellenlink)
- Mockup: [[Bundestag-App-Mockup.excalidraw]] (3 Ansichten: Feed, Detail, Themen-gruppiert)
- Farbvorschau-Dateien: [[07 KI/Bundestag-Design-A-Navy.html]], [[07 KI/Bundestag-Design-B-Teal.html]], [[07 KI/Bundestag-Design-C-Indigo.html]]

**Zustellung/Technik:**
- **Phase 1: Web-Seite** (wie bei der Blutdruck-App) — aktiv nachschauen, keine Push-Benachrichtigung. Kurz erwogen wurde, direkt mit Telegram-Push zu starten (Michael will die App primär aufs Handy, ohne aktiv nachschauen zu müssen) — nach Abwägung Vor-/Nachteile (Telegram: Push aber schlecht durchsuchbar/kein Archiv; Web: durchsuchbares Archiv + das schon entworfene Design, aber kein Push) **Entscheidung: doch erst Web**, Telegram bleibt spätere Phase
- **Später geplant: Telegram-Bot** — für echte Push-Benachrichtigung (kostenlos, offizielle Bot-API), WhatsApp-Automatisierung wurde als unpraktikabel verworfen
- Wichtiger technischer Unterschied zur Blutdruck-App: Diese App braucht **echte Hintergrund-Automatisierung** (regelmäßiges Abrufen + KI-Zusammenfassen), nicht nur lokale Eingabe — das ist der eigentliche Kern-Bauteil, unabhängig davon ob Web oder Telegram

**Automatisierung (aus grill-me-Interview, 2026-07-29):**
- **GitHub Actions mit Cron-Trigger**, im selben Repo wie die GitHub-Pages-Webseite — kostenlos, keine eigene Infrastruktur nötig
- Rhythmus: **1x täglich, Montag bis Freitag** (Bundestag tagt eh nicht am Wochenende) — kein Sonderfall für Sitzungswochen nötig, der Job prüft einfach täglich ob's was Neues gibt
- Wenn nichts Neues da ist (z.B. Sommerpause/sitzungsfreie Zeit): Webseite zeigt weiterhin die letzten vorhandenen Einträge, dazu ein einfacher Hinweistext ("nichts Neues" / Pause) — bewusst **keine** zusätzliche Logik wie Rückblick oder Countdown zum nächsten Sitzungstermin
- Ablauf des täglichen Jobs: scrapen (bundestagszusammenfasser.de) → KI-Zusammenfassung im vereinbarten Format → Daten als Datei ins Repo schreiben → GitHub Pages zeigt aktualisierten Stand

**Hosting:**
- **GitHub Pages**, analog zur Blutdruck-App (`mmlorenz2019.github.io/...`)
- Das Git-Repo selbst dient als dauerhaftes, versioniertes Archiv — **kein separates PDF nötig** (Nutzer-Wunsch "nichts soll verloren gehen" ist damit bereits erfüllt, PDF-Erzeugung wäre unnötiger Zusatzaufwand)

**Projektname:** Bundestag-Kompakt (Entscheidung 2026-07-29 — sachlich, beschreibt direkt den Zweck: kompakte Zusammenfassung)

**Archiv & Übersichten (offene Punkte, 2026-07-29 — noch zu klären):**
- Nichts wird gelöscht — Git-Repo ist dauerhaftes Archiv (s.o.). Offen: wie navigiert man in der Webseite zu älteren Einträgen (z.B. "vor 1 Monat")? Aktuelles Design (Themen-gruppierte Liste) hat noch keine Zeit-/Datums-Navigation vorgesehen — muss in Phase 4 (Frontend) mitgedacht werden
- Wunsch: zusätzlich zu den Tages-Einträgen ein **Wochenüberblick** und ein **Monatsüberblick** als eigene Zusammenfassungs-Ebene
  - **Wochenüberblick:** wird **sonntags** erzeugt (Teil des normalen täglichen Jobs, kein eigener Cronjob — einfach gehalten: an Sonntagen fasst der Lauf zusätzlich die Woche zusammen). Format vorerst simpel/analog zu den Tages-Einträgen, keine Extra-Logik
  - **Monatsüberblick:** noch offen (Rhythmus/Format), später klären
  - Format-Details und Platzierung in der Webseite: noch offen, wird in Phase 2/4 konkretisiert
- Push-Benachrichtigung: aktuell **nicht vorhanden** — Phase 1 ist reine Web-Seite (aktiv nachschauen). Telegram-Bot für Push bleibt spätere, separate Phase (s.u.)

## Test-Zusammenfassung (2026-07-29)
Format anhand eines echten Eintrags von bundestagszusammenfasser.de geprüft: "Gesetz zur Einführung eines antragslosen Kindergeldes" (docid=1152, vom Bundestag bereits verabschiedet, wartet auf Bundesrat).

**Titel:** Kindergeld soll's künftig automatisch geben – ganz ohne Antrag

**Zusammenfassung:** Bisher musste man Kindergeld immer aktiv beantragen. Künftig soll die Familienkasse das Geld nach einer Geburt automatisch auszahlen können, wenn sie ohnehin schon alle nötigen Infos hat (z.B. über die Geburtsmeldung) und eine Kontoverbindung bekannt ist – ganz ohne dass die Eltern etwas beantragen müssen. Zunächst gilt das ab dem zweiten Kind, später soll es auch für das erste Kind kommen. Ziel: weniger Papierkram für frischgebackene Eltern, weniger Verwaltungsaufwand für den Staat. Kritikpunkt aus Anhörungen (u.a. vom Deutschen Kinderhilfswerk): das automatische Verfahren gilt vorerst nur für Familien mit Wohnsitz in Deutschland und mindestens einem erwerbstätigen Elternteil – nicht-erwerbstätige Eltern, die oft besonders auf Unterstützung angewiesen sind, profitieren also (noch) nicht davon. Start: ab 1. Januar 2027, schrittweise.

**Abstimmungsergebnis:**
- **Art:** Ausschuss-Empfehlung (Handzeichen, keine namentliche Abstimmung)
- **Dafür:** CDU/CSU, SPD, Bündnis 90/Die Grünen
- **Dagegen:** –
- **Enthalten:** AfD, Die Linke

**Eingebracht von:** Bundesregierung (Bundesministerium für Finanzen)

**Themenbereich:** Soziales / Familie

**Nächste Schritte:** Muss noch durch den Bundesrat (dort bereits einmal beraten, Status "Beraten", noch nicht final abgestimmt)

**Erkenntnis:** Format funktioniert gut mit echten Daten. Einschränkung: Abstimmungsergebnis ist bei den meisten Vorhaben eine **Ausschuss-Empfehlung mit Fraktions-Tendenz**, keine genaue Kopfzahl-Abstimmung — echte Zahlen gibt's laut Recherche nur bei "namentlichen Abstimmungen" (siehe Datenquellen oben).

## Phasenplan (festgelegt 2026-07-29, analog Blutdruck-App)
Nach jeder Phase: stoppen, gemeinsam testen/besprechen, erst dann weiter.

- [x] **Phase 0 – Grundgerüst:** GitHub-Repo anlegen, GitHub Pages einrichten (leere Platzhalter-Seite im Navy/Slate-Design) — Hosting-Kette steht von Anfang an. *Abgeschlossen 2026-07-30: Repo [github.com/mmlorenz2019/Bundestag-kompakt](https://github.com/mmlorenz2019/Bundestag-kompakt), live unter [mmlorenz2019.github.io/Bundestag-kompakt](https://mmlorenz2019.github.io/Bundestag-kompakt/)*
- [ ] **Phase 1 – Scraping/Datenbasis:** Skript ruft bundestagszusammenfasser.de ab und liest rohe Einträge strukturiert ein (noch ohne KI-Zusammenfassung)
- [ ] **Phase 2 – KI-Zusammenfassung:** Rohdaten aus Phase 1 ins vereinbarte Format bringen (Titel, Zusammenfassung, strukturiertes Abstimmungsergebnis, Einbringer, Themenbereich, nächste Schritte) — Testfälle: Kindergeld-Beispiel von heute + 1-2 weitere
- [ ] **Phase 3 – Automatisierung:** GitHub Actions Cronjob (1x täglich, Mo–Fr) führt Phase 1+2 automatisch aus, schreibt Ergebnis ins Repo, inkl. "nichts Neues"-Fall
- [ ] **Phase 4 – Webseite/Frontend:** Themen-gruppierte Liste + Detailansicht (Navy/Slate, wie im Mockup), liest die von Phase 3 erzeugten Daten
- [ ] **Phase 5 – End-to-End-Test & Go-Live:** Automatik-Durchlauf → Webseite aktualisiert sich → auf dem Handy als PWA installierbar (analog Blutdruck-App), ein paar Tage Zuverlässigkeit beobachten

**Später, außerhalb dieses Plans:** Telegram-Bot für Push-Benachrichtigung (eigene Phase, wenn Phase 0-5 steht).

**Mögliches To-Do für später (2026-07-30):** Zusätzliche Anbindung der offiziellen **DIP-API** als zweite Datenquelle neben bundestagszusammenfasser.de — bewusst zurückgestellt, da Mehraufwand geschätzt ~50-70% für Phase 1 (v.a. Matching-Logik zwischen beiden Quellen, plus API-Key-Beantragung mit Wartezeit). Erst angehen, falls sich in der Praxis zeigt, dass bundestagszusammenfasser.de tatsächlich Themen/Vorgänge verpasst.

## Vorgehen (wichtig für nächste Session)
Genau wie bei der Blutdruck-App: **nach jeder Bauphase stoppen und gemeinsam besprechen/testen**, nicht mehrere Phasen auf einmal durchziehen.

