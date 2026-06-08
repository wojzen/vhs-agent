# GitHub Setup — VHS Kurs-Monitor

## Voraussetzungen

- GitHub-Account vorhanden
- Gmail-Account vorhanden (für den E-Mail-Versand)

---

## Schritt 1: Repo auf GitHub anlegen

1. Gehe zu [github.com](https://github.com) → **"New repository"**
2. Name: `vhs-agent`
3. Sichtbarkeit: **Public** (wichtig — kostenlose unbegrenzte Actions-Minuten)
4. Kein README, kein .gitignore hinzufügen
5. **"Create repository"** klicken

---

## Schritt 2: Gmail App-Passwort erstellen

1. Gehe zu [myaccount.google.com](https://myaccount.google.com) → **Sicherheit**
2. 2-Faktor-Authentifizierung muss aktiv sein (falls nicht: dort aktivieren)
3. Suche nach **"App-Passwörter"** und öffne es
4. Erstelle ein neues App-Passwort mit dem Namen `VHS Monitor`
5. Das **16-stellige Passwort** notieren — es wird nur einmal angezeigt!

---

## Schritt 3: GitHub Secrets anlegen

Im GitHub-Repo: **Settings → Secrets and variables → Actions → "New repository secret"**

Drei Secrets anlegen:

| Name | Wert |
|---|---|
| `GMAIL_USER` | Deine Gmail-Adresse (z.B. `dein.name@gmail.com`) |
| `GMAIL_APP_PASSWORD` | Das 16-stellige App-Passwort aus Schritt 2 |
| `RECIPIENT_EMAIL` | Die E-Mail-Adresse, an die Benachrichtigungen gehen sollen |

---

## Schritt 4: VHS-URL als Variable anlegen

Gleiche Seite, Tab **"Variables"** → **"New repository variable"**

| Name | Wert |
|---|---|
| `VHS_URL` | `https://www.kvhs-harburg.de/kurssuche/suche?suchesetzen=true&clearallkatfilter=true&kfs_stichwort_schlagwort=T%C3%B6pfern` |

---

## Schritt 5: Code pushen

Im Terminal im Projektverzeichnis (GitHub-Benutzernamen ersetzen):

```bash
git remote add origin https://github.com/<dein-github-benutzername>/vhs-agent.git
git branch -M main
git push -u origin main
```

---

## Schritt 6: Workflow testen

Im GitHub-Repo: **Actions → "VHS Kurs-Monitor" → "Run workflow" → "Run workflow"**

Im Log sollte erscheinen:
```
Kein Statuswechsel (verfügbar: false)
```
oder — wenn gerade ein Kurs verfügbar ist:
```
Kurs gefunden — E-Mail gesendet.
```

---

## Fertig

Der Workflow läuft ab jetzt **automatisch jede Stunde**. Du bekommst eine E-Mail wenn:
- Ein Töpferkurs neu buchbar wird
- Ein Töpferkurs wieder verschwindet
