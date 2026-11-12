import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = String.raw`C:\Users\karlv\OneDrive\Skrivbord\Snickar Fakturor\2026`;
const PYTHON = String.raw`C:\Users\karlv\AppData\Local\Python\pythoncore-3.14-64\python.exe`;
const OUT = path.join('data', '_extracted_invoices.json');

/** Prefer the final sent copies; skip underlag/editerbar duplicates. */
const TARGETS = [
  String.raw`Skickade\Andreas modig\Faktura 6001 Andreas Modig - Fönsterrenovering 1 - mailad.pdf`,
  String.raw`Skickade\Andreas modig\Faktura 6002 Andreas Modig -Fönsterrenovering del 2.pdf`,
  String.raw`Skickade\Jerry van Kooten\Faktura 6101 Jerry van Kooten - Dörrbyte.pdf`,
  String.raw`Skickade\2407Tolino trädgård Rastbord 2026.pdf`,
  String.raw`Skickade\Faktura 0119 Nils - Juni2026.pdf`,
  String.raw`Skickade\Faktura 0120 Nils - oktober2026.pdf`,
  String.raw`Skickade\Faktura 1506 Svante Knutlådor_Timmerstomme.pdf`,
  String.raw`Faktura 1507 Svante-Snickartjänster September.pdf`,
  String.raw`Skickade\Faktura 1806 Johan K - Offerbräda Henninge.pdf`,
  String.raw`Skickade\Faktura 5201 Taklagning på ladan - Lars Persson v3.pdf`,
  String.raw`Skickade\Faktura 9008 Erik Bejier Badrum.pdf`,
];

function listFallback() {
  // If exact names differ, discover by invoice number prefix in Skickade
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.toLowerCase().endsWith('.pdf')) results.push(full);
    }
  }
  walk(ROOT);
  return results;
}

const py = `
import sys, json, pymupdf
path = sys.argv[1]
doc = pymupdf.open(path)
pages = [page.get_text() for page in doc]
print(json.dumps({"path": path, "text": "\\n---PAGE---\\n".join(pages)}, ensure_ascii=False))
`;

const allPdfs = listFallback();
const chosen = [];

for (const rel of TARGETS) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    chosen.push(full);
    continue;
  }
  // Fuzzy: match by invoice number in filename
  const numMatch = rel.match(/(\d{4})/);
  if (!numMatch) continue;
  const num = numMatch[1];
  const candidates = allPdfs.filter((p) => path.basename(p).includes(num) && !/Invoice_|Hägglunds|underlag|Editerbar|Strömbergs/i.test(p));
  // Prefer Skickade and non-duplicate versions
  candidates.sort((a, b) => {
    const score = (p) =>
      (p.includes('Skickade') ? 10 : 0) +
      (/Färdig|skicka|v3/i.test(p) ? 5 : 0) +
      (/v2/i.test(p) ? -1 : 0);
    return score(b) - score(a);
  });
  if (candidates[0]) chosen.push(candidates[0]);
}

// Deduplicate by basename invoice number
const byNumber = new Map();
for (const full of chosen) {
  const m = path.basename(full).match(/(\d{4})/);
  const key = m ? m[1] : full;
  if (!byNumber.has(key)) byNumber.set(key, full);
}

const extracted = [];
for (const full of byNumber.values()) {
  try {
    const raw = execFileSync(PYTHON, ['-c', py, full], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    const parsed = JSON.parse(raw.trim());
    extracted.push({
      file: full,
      basename: path.basename(full),
      text: parsed.text,
    });
    console.log('OK', path.basename(full), 'chars=', parsed.text.length);
  } catch (err) {
    console.error('FAIL', full, err.message);
    extracted.push({ file: full, basename: path.basename(full), error: String(err.message || err) });
  }
}

fs.writeFileSync(OUT, JSON.stringify(extracted, null, 2), 'utf8');
console.log('Wrote', OUT, 'count=', extracted.length);
