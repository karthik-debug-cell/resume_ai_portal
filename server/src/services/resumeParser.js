const fs = require('fs/promises');
const path = require('path');
const AppError = require('../utils/AppError');

const MAX_TEXT_CHARS = 200000; // hard cap for what is stored in MongoDB

// Replaces PHP extractResumeText() (which shelled out to pdftotext / hand-parsed ZIP XML)
async function readHead(filePath, bytes = 8) {
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    await fh.read(buf, 0, bytes, 0);
    return buf;
  } finally {
    await fh.close();
  }
}


let pdfjsPromise;
// pdfjs prints harmless "cannot polyfill DOMMatrix/Path2D" warnings in Node (rendering is not used here)
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.resolve().then(() => {
      const { warn, log } = console;
      console.warn = () => {};
      console.log = () => {};
      try {
        return require('pdfjs-dist/legacy/build/pdf.js');
      } finally {
        console.warn = warn;
        console.log = log;
      }
    });
  }
  return pdfjsPromise;
}

async function extractPdfText(filePath, maxPages = 30) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await fs.readFile(filePath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false, verbosity: 0 }).promise;
  try {
    let out = '';
    for (let i = 1; i <= Math.min(doc.numPages, maxPages); i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += `${content.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('')}\n\n`;
    }
    return out;
  } finally {
    await doc.destroy();
  }
}

function normalise(text) {
  return String(text || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

async function extractResumeText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const head = await readHead(filePath);

  try {
    if (ext === '.txt') {
      return normalise(await fs.readFile(filePath, 'utf8'));
    }

    if (ext === '.pdf') {
      if (head.slice(0, 4).toString() !== '%PDF') throw new AppError('The uploaded file is not a valid PDF', 400);
      return normalise(await extractPdfText(filePath));
    }

    if (ext === '.docx') {
      if (head.slice(0, 2).toString() !== 'PK') throw new AppError('The uploaded file is not a valid DOCX', 400);
      const mammoth = require('mammoth');
      const { value } = await mammoth.extractRawText({ path: filePath });
      return normalise(value);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Could not read text from the uploaded resume. The file may be corrupted or password-protected.', 422);
  }

  throw new AppError('Unsupported file type', 400);
}

module.exports = { extractResumeText };
