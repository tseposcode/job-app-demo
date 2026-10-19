// cv.js
// Saving a CV file and reading details out of it.
// The file stays on this device (IndexedDB); only its name and size go in the profile.

import { save } from '../core/store.js';
import { putCv } from '../core/files.js';
import { pdfToText } from '../lib/pdf-text.js';
import { docxToText } from '../lib/docx-text.js';
import { parseCv } from './cv-reader.js';

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const CV_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Returns an error message, or '' if the file is fine.
export function checkCvFile(file) {
  if (!file) return 'Choose a file first.';
  if (!/\.(pdf|docx?)$/i.test(file.name)) return 'Upload a PDF or Word document.';
  if (file.size > MAX_CV_BYTES) return 'That file is over 5 MB. Upload a smaller CV.';
  return '';
}

// iPhone Safari can refuse to read a file again once it has been saved in
// IndexedDB ("WebKitBlobResource error"). So we save an in-memory copy, never
// the file the person picked, and read the CV before saving it.
async function copyOf(file) {
  return new File([await file.arrayBuffer()], file.name, { type: file.type, lastModified: file.lastModified });
}

export async function storeCv(u, file, { demo = false } = {}) {
  await putCv(u.email, await copyOf(file));
  u.cv = { name: file.name, size: file.size, at: Date.now(), demo };
  save();
}

// Reads a PDF or Word (.docx) CV.
// Returns { profile, found, suggested, sensitive, hasIdNumber, note }.
// Old .doc files and scanned PDFs can't be read in the browser, so they return a note instead.
export async function readCv(file) {
  const empty = { profile: {}, found: [], suggested: [], sensitive: [], hasIdNumber: false };
  const name = file.name.toLowerCase();
  if (name.endsWith('.doc')) {
    return { ...empty, note: 'This is an older Word file (.doc), which we cannot read. Save it as PDF or .docx and upload again, or fill in your details below.' };
  }
  try {
    const text = name.endsWith('.docx') ? await docxToText(file) : await pdfToText(file);
    if (text.replace(/\s/g, '').length < 40) {
      return { ...empty, note: 'This CV looks like a scanned picture, so we could not read the words. Fill in your details below.' };
    }
    return { ...parseCv(text), note: '' };
  } catch (err) {
    // The error name helps us find the cause when a tester sends a screenshot.
    const code = (err && err.name) || 'Error';
    console.warn('CV reader failed:', err);
    return { ...empty, note: `We could not read this file. Fill in your details below, or try saving your CV as a PDF. (Error code: ${code})` };
  }
}

// Fields that come from a CV. When someone swaps CVs during sign-up, these are cleared first.
const CV_FIELDS = { phone: '', city: '', province: '', qual: '', study: '', institution: '', gradYear: '', skills: [], experience: '' };

// Copy what the CV reader found into the profile. The name on the account is kept.
export function applyCvDetails(u, profile, { replace = false } = {}) {
  const { name: _name, surname: _surname, prefs, ...rest } = profile;
  if (replace) {
    Object.assign(u, structuredClone(CV_FIELDS));
    u.prefs = { fields: [], types: [], provinces: [], remote: false, relocate: false, minPay: 0 };
  }
  Object.assign(u, rest);
  if (prefs) u.prefs = { ...u.prefs, ...prefs };
  save();
}
