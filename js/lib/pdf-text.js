// pdf-text.js
// Pulls the plain text out of a PDF in the browser, line by line.
// The pdf.js library (js/vendor/pdfjs) is only loaded the first time it's needed.

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

// Returns the PDF's text with one line per visual line, top to bottom.
export async function pdfToText(file, { maxPages = 4 } = {}) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  try {
    const doc = await task.promise;
    const pages = [];
    for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      pages.push(groupIntoLines(content.items));
    }
    return pages.join('\n');
  } finally {
    task.destroy(); // frees the worker's memory
  }
}

// pdf.js gives loose pieces of text with x/y positions; rebuild the lines.
function groupIntoLines(items) {
  const rows = new Map();
  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5]);
    const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push({ x: item.transform[4], text: item.str });
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) =>
      parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .join('\n');
}
