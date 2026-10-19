// cv-viewer.js (sheet)
// Shows the person's CV inside the app. iPhone Safari blocks opening a new tab
// after the file has loaded (and a home-screen app has no tabs at all), so a
// PDF is drawn here page by page with pdf.js, and a Word CV is shown as text.
// "Download" is there as well, for saving or opening the file elsewhere.

import { $, esc } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { loadPdfJs } from '../../lib/pdf-text.js';
import { docxToText } from '../../lib/docx-text.js';
import { openSheet } from '../../ui/sheet.js';

const MAX_PAGES = 6;

async function drawPdf(bytes, box) {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false });
  const doc = await task.promise;
  box.innerHTML = '';
  const width = box.clientWidth || 340;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (width / base.width) * ratio });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = 'cv-page';
    canvas.setAttribute('aria-label', `Page ${n}`);
    box.appendChild(canvas);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  }
  if (doc.numPages > MAX_PAGES) box.insertAdjacentHTML('beforeend', `<p class="small muted">Showing the first ${MAX_PAGES} of ${doc.numPages} pages. Download to see all.</p>`);
  task.destroy();
}

export async function openCvViewer(file) {
  const name = file.name || 'CV';
  const url = URL.createObjectURL(file);
  const root = openSheet(`
    <div class="sheet-h"><div><h3>${esc(name)}</h3><span class="who">Your CV, as employers receive it.</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <div class="cv-view" id="cvBox"><div class="co-busy"><span class="spinner" aria-hidden="true"></span><span class="small muted">Opening your CV...</span></div></div>
    <a class="btn wide" id="cvDownload" href="${url}" download="${esc(name)}">Download</a>`);
  const box = $('#cvBox', root);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (/\.docx$/i.test(name)) {
      const text = await docxToText(new File([bytes], name));
      box.innerHTML = `<div class="card"><p class="prose">${esc(text.trim())}</p></div><p class="small muted">Word CVs are shown as text here. Download to see the layout.</p>`;
    } else if (/\.pdf$/i.test(name)) {
      await drawPdf(bytes, box);
    } else {
      box.innerHTML = '<p class="muted">This file type can\'t be shown here. Use Download.</p>';
    }
  } catch (err) {
    box.innerHTML = `<p class="muted">We couldn't show this CV here (${esc((err && err.name) || 'Error')}). Use Download, or upload it again.</p>`;
  }
  setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
}
