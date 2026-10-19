// docx-text.js
// Reads the text of a Word .docx file in the browser, with no extra library.
// A .docx is a zip file; the words are in word/document.xml (and any headers).
// Table rows come out as one line with TABs between cells, so a personal
// details table ("Cell number | 071 000 1234") reads as a label and its value.
// Old .doc files (Word 97-2003) are a different format and are not supported.

export async function docxToText(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const entries = zipEntries(buf);
  const names = [...Object.keys(entries).filter((n) => /^word\/header\d*\.xml$/.test(n)).sort(), 'word/document.xml'];
  const parts = [];
  for (const name of names) {
    if (entries[name]) parts.push(xmlToText(await unzipEntry(buf, entries[name])));
  }
  if (!parts.length) throw new Error('No Word document inside this file');
  return parts.join('\n');
}

// Read the zip's table of contents (the "central directory" at the end of the file).
function zipEntries(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let end = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('Not a .docx (zip) file');
  const count = dv.getUint16(end + 10, true);
  let p = dv.getUint32(end + 16, true);
  const entries = {};
  const dec = new TextDecoder();
  for (let n = 0; n < count && dv.getUint32(p, true) === 0x02014b50; n++) {
    const nameLen = dv.getUint16(p + 28, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));
    entries[name] = { method: dv.getUint16(p + 10, true), size: dv.getUint32(p + 20, true), offset: dv.getUint32(p + 42, true) };
    p += 46 + nameLen + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  return entries;
}

async function unzipEntry(buf, { method, size, offset }) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const start = offset + 30 + dv.getUint16(offset + 26, true) + dv.getUint16(offset + 28, true);
  const data = buf.subarray(start, start + size);
  if (method === 0) return new TextDecoder().decode(data);
  if (method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('Cannot unpack this file here');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENTITIES[e] ?? m,
  );
const stripTags = (s) => s.replace(/<[^>]+>/g, '');

function xmlToText(xml) {
  const clean = xml
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '') // hidden field codes, e.g. HYPERLINK
    .replace(/<w:delText[^>]*>[\s\S]*?<\/w:delText>/g, '') // deleted tracked changes
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:(br|cr)\b[^>]*\/>/g, '\n');
  // Each table row on one line: cells joined by TABs.
  const rowsDone = clean.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g, (row) =>
    `${stripTags(row.replace(/<\/w:p>/g, ' ').replace(/<\/w:tc>/g, '\t')).replace(/[ ]+\t/g, '\t').trim()}\n`,
  );
  return decode(stripTags(rowsDone.replace(/<\/w:p>/g, '\n')))
    .split('\n')
    .map((l) => l.replace(/[  ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}
