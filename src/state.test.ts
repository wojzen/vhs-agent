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
