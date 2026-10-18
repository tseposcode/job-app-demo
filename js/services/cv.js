// cv.js
// Saving a CV file and reading details out of it.
// The file stays on this device (IndexedDB); only its name and size go in the profile.

import { save } from '../core/store.js';
import { putCv } from '../core/files.js';
import { pdfToText } from '../lib/pdf-text.js';
import { parseCv } from './cv-reader.js';

export const MAX_CV_BYTES = 5 * 1024 * 1024;

// Returns an error message, or '' if the file is fine.
export function checkCvFile(file) {
  if (!file) return 'Choose a file first.';
  if (!/\.(pdf|docx?)$/i.test(file.name)) return 'Upload a PDF or Word document.';
  if (file.size > MAX_CV_BYTES) return 'That file is over 5 MB. Upload a smaller CV.';
  return '';
}

export async function storeCv(u, file, { demo = false } = {}) {
  await putCv(u.email, file);
  u.cv = { name: file.name, size: file.size, at: Date.now(), demo };
  save();
}

// Reads a PDF CV. Returns { profile, found, hasIdNumber, note }.
// Word files and scanned PDFs can't be read in the browser, so they return a note instead.
export async function readCv(file) {
  const empty = { profile: {}, found: [], hasIdNumber: false };
  if (!/\.pdf$/i.test(file.name)) {
    return { ...empty, note: 'We can read details from PDF CVs. For Word files, fill in your details below.' };
  }
  try {
    const text = await pdfToText(file);
    if (text.replace(/\s/g, '').length < 40) {
      return { ...empty, note: 'This PDF looks like a scanned image, so we could not read it. Fill in your details below.' };
    }
    return { ...parseCv(text), note: '' };
  } catch {
    return { ...empty, note: 'We could not read this PDF. Fill in your details below.' };
  }
}

// Copy what the CV reader found into the profile. The name on the account is kept.
export function applyCvDetails(u, profile) {
  const { name: _name, surname: _surname, prefs, ...rest } = profile;
  Object.assign(u, rest);
  if (prefs) u.prefs = { ...u.prefs, ...prefs };
  save();
}
