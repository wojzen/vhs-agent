const SEARCH_TERMS = [
  'Drehen an der Töpferscheibe',
  'Für AnfängerInnen und Fortgeschrittene',
] as const;

export function isCourseAvailable(html: string): boolean {
  return SEARCH_TERMS.every(term => html.includes(term));
}
