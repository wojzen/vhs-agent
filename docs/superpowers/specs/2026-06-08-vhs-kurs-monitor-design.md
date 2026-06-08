# VHS Kurs-Monitor — Design Spec

**Datum:** 2026-06-08  
**Status:** Genehmigt

## Ziel

Automatische stündliche Überwachung der Website der Kreisvolkshochschule (KVHS) Landkreis Harburg auf Töpferkurse. Bei Statusänderungen wird eine E-Mail verschickt.

## Hintergrund

Töpferkurse bei der KVHS Landkreis Harburg sind sehr gefragt und schnell ausgebucht. Manuelles tägliches Prüfen ist aufwendig. Der Monitor übernimmt das automatisch und benachrichtigt sobald ein Kurs buchbar wird.

## Ziel-URL

Die genaue URL der KVHS-Kursseite wird vor der Implementierung geprüft (z.B. Kurssuche oder Programmheft-Seite auf der KVHS-Website). Die URL wird in `monitor.yml` als Umgebungsvariable `VHS_URL` hinterlegt.

## Suchbegriffe

Ein Kurs gilt als **gefunden**, wenn **beide** Begriffe auf der Seite vorkommen:

- `"Drehen an der Töpferscheibe"` (Pflicht)
- `"Für AnfängerInnen und Fortgeschrittene"` (Pflicht)

Nur wenn beide Begriffe gleichzeitig gefunden werden, wird eine Benachrichtigung ausgelöst. Das verhindert Fehlalarme falls einer der Begriffe in einem anderen Kontext auftaucht.

## Architektur

### Komponenten

| Datei | Zweck |
|---|---|
| `check.ts` | Hauptskript: Website abrufen, HTML parsen, Status vergleichen, Mail senden |
| `status.json` | Zustandsdatei: speichert ob Kurs zuletzt verfügbar war |
| `.github/workflows/monitor.yml` | GitHub Actions Workflow: Cron-Schedule, Ausführung von check.ts |
| `package.json` | npm-Abhängigkeiten: `tsx`, `cheerio` |

### Ablauf

```
Jede Stunde (GitHub Actions Cron: 0 * * * *)
    → check.ts startet via: npx tsx check.ts
    → VHS-Website per fetch() abrufen
    → HTML mit cheerio nach Suchbegriff durchsuchen
    → status.json lesen (kurs_verfuegbar: true/false)

    Fall 1: Kurs neu verfügbar (vorher false, jetzt gefunden)
        → E-Mail: "Töpferkurs ist jetzt buchbar!"
        → status.json auf true setzen
        → status.json committen und pushen

    Fall 2: Kurs wieder weg (vorher true, jetzt nicht gefunden)
        → E-Mail: "Töpferkurs ist nicht mehr verfügbar"
        → status.json auf false setzen
        → status.json committen und pushen

    Fall 3: Keine Änderung
        → Nichts tun, kein Commit
```

## Technologie

| Technologie | Begründung |
|---|---|
| TypeScript | Bevorzugte Sprache |
| `tsx` | Führt TypeScript direkt aus ohne Build-Schritt (`npx tsx check.ts`) |
| `cheerio` | HTML-Parsing serverseitig (wie jQuery, aber in Node.js) |
| GitHub Actions | Kostenloses Hosting, stündlicher Cron-Job |
| Gmail SMTP | E-Mail-Versand über bestehendes Gmail-Konto |

## Hosting & Kosten

- **Repo-Typ:** Public (unbegrenzte GitHub Actions Minuten, kostenlos)
- **Cron-Frequenz:** Stündlich (`0 * * * *`)
- **Kosten:** 0 €

## Sicherheit

- Gmail-Benutzername und App-Passwort werden **nicht** im Code gespeichert
- Beide Werte werden als **GitHub Secrets** hinterlegt:
  - `GMAIL_USER` — die Gmail-Adresse des Absenders
  - `GMAIL_APP_PASSWORD` — ein Gmail App-Passwort (nicht das normale Login-Passwort)
- Der Empfänger (E-Mail-Adresse der Frau) kann ebenfalls als Secret oder direkt im Workflow stehen

## E-Mail-Benachrichtigungen

| Ereignis | Betreff |
|---|---|
| Kurs erscheint | "Töpferkurs verfügbar — jetzt anmelden!" |
| Kurs verschwindet | "Töpferkurs ist nicht mehr verfügbar" |

## Einrichtung (einmalig)

1. GitHub-Repo erstellen (public)
2. Code ins Repo pushen
3. Gmail App-Passwort generieren (in Google-Konto unter "Sicherheit")
4. GitHub Secrets anlegen: `GMAIL_USER`, `GMAIL_APP_PASSWORD`
5. Workflow wird automatisch aktiv

## Nicht im Scope (Version 1)

- Automatische Buchung (geplant für Version 2)
- Mehrere Kurse gleichzeitig überwachen
- SMS-Benachrichtigung
