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
