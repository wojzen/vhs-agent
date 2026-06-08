import * as cheerio from 'cheerio';

const SEARCH_TERMS = [
  'Drehen an der Töpferscheibe',
  'Für AnfängerInnen und Fortgeschrittene',
] as const;

export function isCourseAvailable(html: string): boolean {
  if (!SEARCH_TERMS.every(term => html.includes(term))) return false;

  const $ = cheerio.load(html);
  const statusElements = $('.status-info');

  if (statusElements.length === 0) return true;

  let onWaitlist = false;
  statusElements.each((_, el) => {
    if ($(el).text().includes('Anmeldung auf Warteliste')) {
      onWaitlist = true;
    }
  });

  return !onWaitlist;
}
