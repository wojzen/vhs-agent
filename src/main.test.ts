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
