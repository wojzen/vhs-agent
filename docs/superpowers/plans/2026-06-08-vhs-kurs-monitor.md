# VHS Kurs-Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stündlicher GitHub Actions Workflow der die KVHS Landkreis Harburg Website auf Töpferkurse prüft und bei Statusänderungen eine E-Mail via Gmail verschickt.

**Architecture:** Ein TypeScript-Skript (`src/main.ts`) wird stündlich von GitHub Actions ausgeführt. Es lädt die VHS-Seite, prüft ob beide Suchbegriffe vorkommen, vergleicht mit dem gespeicherten Zustand in `status.json`, und verschickt bei Änderungen eine E-Mail. Der neue Zustand wird zurück ins Repo committed.

**Tech Stack:** TypeScript, tsx, nodemailer, vitest, GitHub Actions

> **Hinweis zu cheerio:** Die Spec erwähnt cheerio, aber da wir nur Text-Suche brauchen (keine CSS-Selektoren), reicht `html.includes()`. Cheerio wird weggelassen (YAGNI).

---

## Dateistruktur

| Datei | Zweck |
|---|---|
| `src/detector.ts` | `isCourseAvailable(html)` — prüft ob beide Suchbegriffe im HTML vorkommen |
| `src/detector.test.ts` | Tests für detector.ts |
| `src/state.ts` | `readStatus()` / `writeStatus()` — liest/schreibt `status.json` |
| `src/state.test.ts` | Tests für state.ts |
| `src/mailer.ts` | `sendEmail(subject, body)` — sendet E-Mail via Gmail SMTP |
| `src/mailer.test.ts` | Tests für mailer.ts |
| `src/main.ts` | Orchestrierung: fetch → detect → compare → mail → save |
| `src/main.test.ts` | Tests für main.ts |
| `status.json` | Persistierter Zustand: `{"kurs_verfuegbar": false}` |
| `.github/workflows/monitor.yml` | Cron-Workflow |
| `package.json` | Dependencies und Scripts |
| `tsconfig.json` | TypeScript-Konfiguration |
| `.gitignore` | `.env` und `node_modules` ausschließen |
| `.env.example` | Dokumentation der benötigten Umgebungsvariablen |

---

### Task 1: Projekt-Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Schritt 1: package.json erstellen**

```json
{
  "name": "vhs-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "nodemailer": "^6.9.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Schritt 2: tsconfig.json erstellen**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Schritt 3: .gitignore erstellen**

```
node_modules/
.env
dist/
```

- [ ] **Schritt 4: .env.example erstellen**

```
GMAIL_USER=deine@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
RECIPIENT_EMAIL=frau@example.com
VHS_URL=https://kvhs-harburg.de/...
```

- [ ] **Schritt 5: Dependencies installieren**

```bash
npm install
```

Erwartete Ausgabe: `added X packages`

- [ ] **Schritt 6: src/ Verzeichnis anlegen**

```bash
mkdir src
```

- [ ] **Schritt 7: Committen**

```bash
git add package.json tsconfig.json .gitignore .env.example package-lock.json
git commit -m "chore: project setup"
```

---

### Task 2: VHS-URL finden

**Files:**
- Modify: `.env.example` (URL ergänzen)

- [ ] **Schritt 1: VHS-Website öffnen**

Öffne im Browser: `https://www.kvhs-harburg.de`

Navigiere zur Kurssuche und suche nach "Töpfern". Kopiere die URL der Suchergebnisseite.

Typisches Muster: `https://www.kvhs-harburg.de/kurssuche?q=töpfern` oder ähnlich.

- [ ] **Schritt 2: URL verifizieren**

Stelle sicher, dass auf der gefundenen Seite mindestens einer der folgenden Begriffe sichtbar ist:
- `Drehen an der Töpferscheibe`
- `Für AnfängerInnen und Fortgeschrittene`

- [ ] **Schritt 3: URL in .env.example eintragen**

```
VHS_URL=https://www.kvhs-harburg.de/<korrekte-pfad-hier>
```

- [ ] **Schritt 4: .env Datei für lokale Entwicklung anlegen (nicht committen!)**

Erstelle `.env` (liegt in .gitignore):
```
GMAIL_USER=deine@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
RECIPIENT_EMAIL=empfaengerin@example.com
VHS_URL=https://www.kvhs-harburg.de/<korrekte-pfad>
```

- [ ] **Schritt 5: Committen**

```bash
git add .env.example
git commit -m "chore: document VHS URL"
```

---

### Task 3: Course Detector

**Files:**
- Create: `src/detector.ts`
- Create: `src/detector.test.ts`

- [ ] **Schritt 1: Failing Test schreiben**

Erstelle `src/detector.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isCourseAvailable } from './detector.js';

describe('isCourseAvailable', () => {
  it('returns true when both search terms are present', () => {
    const html = `
      <h3>Drehen an der Töpferscheibe</h3>
      <p>Für AnfängerInnen und Fortgeschrittene</p>
    `;
    expect(isCourseAvailable(html)).toBe(true);
  });

  it('returns false when first term is missing', () => {
    const html = `<p>Für AnfängerInnen und Fortgeschrittene</p>`;
    expect(isCourseAvailable(html)).toBe(false);
  });

  it('returns false when second term is missing', () => {
    const html = `<h3>Drehen an der Töpferscheibe</h3>`;
    expect(isCourseAvailable(html)).toBe(false);
  });

  it('returns false for empty html', () => {
    expect(isCourseAvailable('')).toBe(false);
  });

  it('returns false when neither term is present', () => {
    const html = `<p>Aquarellkurs für Einsteiger</p>`;
    expect(isCourseAvailable(html)).toBe(false);
  });
});
```

- [ ] **Schritt 2: Test zum Scheitern bringen**

```bash
npm test
```

Erwartete Ausgabe: `FAIL src/detector.test.ts` — `Cannot find module './detector.js'`

- [ ] **Schritt 3: Implementierung schreiben**

Erstelle `src/detector.ts`:

```typescript
const SEARCH_TERMS = [
  'Drehen an der Töpferscheibe',
  'Für AnfängerInnen und Fortgeschrittene',
] as const;

export function isCourseAvailable(html: string): boolean {
  return SEARCH_TERMS.every(term => html.includes(term));
}
```

- [ ] **Schritt 4: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `PASS src/detector.test.ts` — 5 tests passed

- [ ] **Schritt 5: Committen**

```bash
git add src/detector.ts src/detector.test.ts
git commit -m "feat: course detector"
```

---

### Task 4: Status Store

**Files:**
- Create: `src/state.ts`
- Create: `src/state.test.ts`

- [ ] **Schritt 1: Failing Tests schreiben**

Erstelle `src/state.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readStatus, writeStatus } from './state.js';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let tempFile: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'vhs-test-'));
  tempFile = join(tempDir, 'status.json');
});

afterEach(() => {
  rmSync(tempDir, { recursive: true });
});

describe('readStatus', () => {
  it('returns default status when file does not exist', () => {
    const status = readStatus('/nonexistent/path.json');
    expect(status).toEqual({ kurs_verfuegbar: false });
  });

  it('reads existing status from file', () => {
    writeStatus({ kurs_verfuegbar: true }, tempFile);
    expect(readStatus(tempFile)).toEqual({ kurs_verfuegbar: true });
  });
});

describe('writeStatus', () => {
  it('writes status to file and can be read back', () => {
    writeStatus({ kurs_verfuegbar: true }, tempFile);
    expect(readStatus(tempFile).kurs_verfuegbar).toBe(true);
  });

  it('overwrites existing status', () => {
    writeStatus({ kurs_verfuegbar: true }, tempFile);
    writeStatus({ kurs_verfuegbar: false }, tempFile);
    expect(readStatus(tempFile).kurs_verfuegbar).toBe(false);
  });
});
```

- [ ] **Schritt 2: Test zum Scheitern bringen**

```bash
npm test
```

Erwartete Ausgabe: `FAIL src/state.test.ts` — `Cannot find module './state.js'`

- [ ] **Schritt 3: Implementierung schreiben**

Erstelle `src/state.ts`:

```typescript
import { readFileSync, writeFileSync } from 'fs';

export interface Status {
  kurs_verfuegbar: boolean;
}

export function readStatus(path = 'status.json'): Status {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Status;
  } catch {
    return { kurs_verfuegbar: false };
  }
}

export function writeStatus(status: Status, path = 'status.json'): void {
  writeFileSync(path, JSON.stringify(status, null, 2) + '\n');
}
```

- [ ] **Schritt 4: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `PASS src/state.test.ts` — 4 tests passed

- [ ] **Schritt 5: Committen**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat: status store"
```

---

### Task 5: Email Sender

**Files:**
- Create: `src/mailer.ts`
- Create: `src/mailer.test.ts`

- [ ] **Schritt 1: Failing Test schreiben**

Erstelle `src/mailer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('nodemailer', () => ({
  default: { createTransport: mockCreateTransport },
}));

import { sendEmail } from './mailer.js';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
    process.env.GMAIL_USER = 'sender@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'test-password';
    process.env.RECIPIENT_EMAIL = 'recipient@example.com';
  });

  it('creates a Gmail SMTP transporter', async () => {
    mockSendMail.mockResolvedValue({});
    await sendEmail('Test Subject', 'Test Body');

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'sender@gmail.com', pass: 'test-password' },
    });
  });

  it('sends email with correct fields', async () => {
    mockSendMail.mockResolvedValue({});
    await sendEmail('Töpferkurs verfügbar', 'Jetzt anmelden!');

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'sender@gmail.com',
      to: 'recipient@example.com',
      subject: 'Töpferkurs verfügbar',
      text: 'Jetzt anmelden!',
    });
  });

  it('throws when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(sendEmail('Subject', 'Body')).rejects.toThrow('SMTP error');
  });
});
```

- [ ] **Schritt 2: Test zum Scheitern bringen**

```bash
npm test
```

Erwartete Ausgabe: `FAIL src/mailer.test.ts` — `Cannot find module './mailer.js'`

- [ ] **Schritt 3: Implementierung schreiben**

Erstelle `src/mailer.ts`:

```typescript
import nodemailer from 'nodemailer';

export async function sendEmail(subject: string, body: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER!,
    to: process.env.RECIPIENT_EMAIL!,
    subject,
    text: body,
  });
}
```

- [ ] **Schritt 4: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `PASS src/mailer.test.ts` — 3 tests passed

- [ ] **Schritt 5: Committen**

```bash
git add src/mailer.ts src/mailer.test.ts
git commit -m "feat: email sender"
```

---

### Task 6: Main Orchestration

**Files:**
- Create: `src/main.ts`
- Create: `src/main.test.ts`

- [ ] **Schritt 1: Failing Tests schreiben**

Erstelle `src/main.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

vi.mock('./mailer.js', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));

import { sendEmail } from './mailer.js';
import { run } from './main.js';
import { readStatus, writeStatus } from './state.js';

let tempDir: string;
let tempFile: string;

beforeEach(() => {
  vi.resetAllMocks();
  tempDir = mkdtempSync(join(tmpdir(), 'vhs-main-test-'));
  tempFile = join(tempDir, 'status.json');
  process.env.VHS_URL = 'https://example.com/vhs';
  vi.mocked(sendEmail).mockResolvedValue(undefined);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true });
});

describe('run', () => {
  it('sends email and updates status when course appears', async () => {
    writeStatus({ kurs_verfuegbar: false }, tempFile);
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(
        'Drehen an der Töpferscheibe Für AnfängerInnen und Fortgeschrittene'
      ),
    } as any);

    await run(tempFile);

    expect(sendEmail).toHaveBeenCalledWith(
      'Töpferkurs verfügbar — jetzt anmelden!',
      expect.stringContaining('buchbar')
    );
    expect(readStatus(tempFile).kurs_verfuegbar).toBe(true);
  });

  it('sends email and updates status when course disappears', async () => {
    writeStatus({ kurs_verfuegbar: true }, tempFile);
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve('<p>Aquarellkurs</p>'),
    } as any);

    await run(tempFile);

    expect(sendEmail).toHaveBeenCalledWith(
      'Töpferkurs nicht mehr verfügbar',
      expect.stringContaining('nicht mehr')
    );
    expect(readStatus(tempFile).kurs_verfuegbar).toBe(false);
  });

  it('does nothing when status has not changed (course available)', async () => {
    writeStatus({ kurs_verfuegbar: true }, tempFile);
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve(
        'Drehen an der Töpferscheibe Für AnfängerInnen und Fortgeschrittene'
      ),
    } as any);

    await run(tempFile);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does nothing when status has not changed (course unavailable)', async () => {
    writeStatus({ kurs_verfuegbar: false }, tempFile);
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve('<p>Aquarellkurs</p>'),
    } as any);

    await run(tempFile);

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Schritt 2: Test zum Scheitern bringen**

```bash
npm test
```

Erwartete Ausgabe: `FAIL src/main.test.ts` — `Cannot find module './main.js'`

- [ ] **Schritt 3: Implementierung schreiben**

Erstelle `src/main.ts`:

```typescript
import { isCourseAvailable } from './detector.js';
import { readStatus, writeStatus } from './state.js';
import { sendEmail } from './mailer.js';
import { pathToFileURL } from 'url';

export async function run(statusPath = 'status.json'): Promise<void> {
  const url = process.env.VHS_URL!;
  const response = await fetch(url);
  const html = await response.text();

  const available = isCourseAvailable(html);
  const { kurs_verfuegbar: wasAvailable } = readStatus(statusPath);

  if (available && !wasAvailable) {
    await sendEmail(
      'Töpferkurs verfügbar — jetzt anmelden!',
      `Ein Töpferkurs ist jetzt buchbar:\n${url}`
    );
    writeStatus({ kurs_verfuegbar: true }, statusPath);
    console.log('Kurs gefunden — E-Mail gesendet.');
  } else if (!available && wasAvailable) {
    await sendEmail(
      'Töpferkurs nicht mehr verfügbar',
      'Der Töpferkurs ist leider nicht mehr buchbar.'
    );
    writeStatus({ kurs_verfuegbar: false }, statusPath);
    console.log('Kurs verschwunden — E-Mail gesendet.');
  } else {
    console.log(`Kein Statuswechsel (verfügbar: ${available}).`);
  }
}

// Nur ausführen wenn diese Datei direkt gestartet wird (nicht beim Import im Test)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Schritt 4: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `PASS src/main.test.ts` — 4 tests passed. Alle Tests: `PASS` (12+ tests insgesamt)

- [ ] **Schritt 5: Committen**

```bash
git add src/main.ts src/main.test.ts
git commit -m "feat: main orchestration"
```

---

### Task 7: Initialer Status

**Files:**
- Create: `status.json`

- [ ] **Schritt 1: status.json erstellen**

```json
{
  "kurs_verfuegbar": false
}
```

- [ ] **Schritt 2: Committen**

```bash
git add status.json
git commit -m "chore: initial status"
```

---

### Task 8: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/monitor.yml`

- [ ] **Schritt 1: Workflow-Verzeichnis anlegen**

```bash
mkdir -p .github/workflows
```

- [ ] **Schritt 2: monitor.yml erstellen**

```yaml
name: VHS Kurs-Monitor

on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Kurs prüfen
        env:
          GMAIL_USER: ${{ secrets.GMAIL_USER }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          RECIPIENT_EMAIL: ${{ secrets.RECIPIENT_EMAIL }}
          VHS_URL: ${{ vars.VHS_URL }}
        run: npx tsx src/main.ts

      - name: Status committen
        run: |
          git config user.name "vhs-monitor[bot]"
          git config user.email "vhs-monitor[bot]@users.noreply.github.com"
          git add status.json
          if ! git diff --cached --quiet; then
            git commit -m "chore: update course status [skip ci]"
            git push
          fi
```

> **Hinweis zu `[skip ci]`:** Dieser Tag im Commit-Message verhindert, dass der Push durch den Bot einen neuen Workflow-Run auslöst.

- [ ] **Schritt 3: Committen**

```bash
git add .github/workflows/monitor.yml
git commit -m "feat: GitHub Actions workflow"
```

---

### Task 9: GitHub Setup (einmalig)

**Keine Dateien** — manuelle Schritte in GitHub.

- [ ] **Schritt 1: Repo auf GitHub erstellen**

1. Gehe zu github.com → "New repository"
2. Name: `vhs-agent`
3. Sichtbarkeit: **Public** (für kostenlose unbegrenzte Minuten)
4. Kein README, kein .gitignore (haben wir bereits)
5. "Create repository" klicken

- [ ] **Schritt 2: Gmail App-Passwort erstellen**

1. Gehe zu myaccount.google.com → Sicherheit
2. 2-Faktor-Authentifizierung muss aktiv sein
3. Suche nach "App-Passwörter"
4. Erstelle ein neues App-Passwort (Name z.B. "VHS Monitor")
5. Notiere das 16-stellige Passwort (wird nur einmal angezeigt)

- [ ] **Schritt 3: GitHub Secrets anlegen**

Im GitHub-Repo: Settings → Secrets and variables → Actions → "New repository secret"

| Name | Wert |
|---|---|
| `GMAIL_USER` | Deine Gmail-Adresse |
| `GMAIL_APP_PASSWORD` | Das 16-stellige App-Passwort |
| `RECIPIENT_EMAIL` | E-Mail-Adresse deiner Frau |

- [ ] **Schritt 4: VHS_URL als Variable anlegen**

Im GitHub-Repo: Settings → Secrets and variables → Actions → Tab "Variables" → "New repository variable"

| Name | Wert |
|---|---|
| `VHS_URL` | Die gefundene URL aus Task 2 |

- [ ] **Schritt 5: Code pushen**

```bash
git remote add origin https://github.com/<dein-username>/vhs-agent.git
git branch -M main
git push -u origin main
```

- [ ] **Schritt 6: Workflow manuell testen**

Im GitHub-Repo: Actions → "VHS Kurs-Monitor" → "Run workflow" → "Run workflow"

Prüfe den Log auf Fehler. Erwartete Ausgabe im Log:
```
Kein Statuswechsel (verfügbar: false)
```
oder
```
Kurs gefunden — E-Mail gesendet.
```
