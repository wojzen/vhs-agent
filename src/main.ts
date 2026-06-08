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
