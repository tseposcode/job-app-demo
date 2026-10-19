// pdf-text.js
// Pulls the plain text out of a PDF in the browser, line by line, in reading order.
// The pdf.js library (js/vendor/pdfjs) is only loaded the first time it's needed.
//
// Two-column CVs (a sidebar with contact and skills, common in Canva templates)
// are read one column at a time, so headings stay with their own content.
// Text pieces on one line that are far apart are joined with a TAB, so
// "Surname        Mokoena" reads as a label and its value.

let pdfjsPromise = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('../vendor/pdfjs/pdf.min.mjs').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// Returns the PDF's text with one line per visual line.
export async function pdfToText(file, { maxPages = 4 } = {}) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  try {
    const doc = await task.promise;
    const pages = [];
    for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
      const page = await doc.getPage(n);
      const { width } = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push(pageToText(content.items, width));
    }
    return pages.join('\n');
  } finally {
    task.destroy(); // frees the worker's memory
  }
}

const sizeOf = (item) => Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 10;

// Group pieces into rows by height on the page, top to bottom.
function groupRows(items) {
  const rows = [];
  items
    .filter((it) => it.str && it.str.trim())
    .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])
    .forEach((it) => {
      const y = it.transform[5];
      const row = rows.find((r) => Math.abs(r.y - y) <= Math.max(2, sizeOf(it) * 0.3));
      if (row) row.items.push(it);
      else rows.push({ y, items: [it] });
    });
  rows.forEach((r) => r.items.sort((a, b) => a.transform[4] - b.transform[4]));
  return rows;
}

// Split a row where there is a wide gap; join close pieces with a space or nothing.
function segmentsOf(row) {
  const segs = [];
  let cur = null;
  for (const it of row.items) {
    const x = it.transform[4];
    const end = x + (it.width || it.str.length * sizeOf(it) * 0.5);
    if (cur) {
      const gap = x - cur.end;
      if (gap > Math.max(14, sizeOf(it) * 1.6)) {
        segs.push(cur);
        cur = null;
      } else {
        cur.text += (gap > sizeOf(it) * 0.12 && !/\s$/.test(cur.text) && !/^\s/.test(it.str) ? ' ' : '') + it.str;
        cur.end = end;
        continue;
      }
    }
    cur = { x, end, text: it.str };
  }
  if (cur) segs.push(cur);
  return segs.map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() }));
}

// Find where a second column starts: many pieces starting at the same x in the
// middle of the page, running down most of it. If the left side is mostly dates
// (a date margin next to one column of text), it is not treated as a column.
function columnEdge(rows, width) {
  const segs = rows.flatMap((r) => r.segs.map((s) => ({ ...s, y: r.y })));
  const counts = new Map();
  for (const s of segs) {
    if (s.x < width * 0.25 || s.x > width * 0.65) continue;
    const k = Math.round(s.x / 4) * 4;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let edge = null;
  let n = 0;
  for (const [k, c] of counts) if (c > n) [edge, n] = [k, c];
  if (edge === null || n < 6 || n < rows.length * 0.2) return null;
  const right = segs.filter((s) => s.x >= edge - 4);
  const left = segs.filter((s) => s.x < edge - 4);
  const ys = segs.map((s) => s.y);
  const rys = right.map((s) => s.y);
  const tall = (Math.max(...rys) - Math.min(...rys)) / Math.max(1, Math.max(...ys) - Math.min(...ys));
  const datey = left.filter((s) => /\b(19|20)\d\d\b/.test(s.text) && s.text.length < 24).length;
  if (tall < 0.5 || left.length < 4 || datey / left.length > 0.5) return null;
  return edge - 4;
}

export function pageToText(items, width) {
  const rows = groupRows(items).map((r) => ({ y: r.y, segs: segmentsOf(r) }));
  const edge = columnEdge(rows, width);
  const lineOf = (segs) => segs.map((s) => s.text).join('\t');
  if (edge === null) return rows.map((r) => lineOf(r.segs)).join('\n');
  const left = rows.map((r) => lineOf(r.segs.filter((s) => s.x < edge))).filter(Boolean);
  const right = rows.map((r) => lineOf(r.segs.filter((s) => s.x >= edge))).filter(Boolean);
  return [...left, ...right].join('\n');
}
