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
