import fs from 'node:fs';
import path from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const root = process.cwd();
const readPart = (name) => fs.readFileSync(path.join(root, '.static', name), 'utf8').trim();
const part1 = readPart('portfolio-01.br.b64');
const part2 = readPart('portfolio-02.br.b64');
const part3 = readPart('portfolio-03.br.b64');

let html = null;
let lastError = null;
for (const encoded of [part1 + part2 + part3, part1 + part2]) {
  try {
    html = brotliDecompressSync(Buffer.from(encoded, 'base64')).toString('utf8');
    break;
  } catch (error) {
    lastError = error;
  }
}
if (html === null) throw lastError ?? new Error('Static portfolio artifact could not be decompressed');

const required = ['Agent Proof Runtime', 'mini-audit-form', 'social-grid', 'id="lightning"'];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
for (const forbidden of ['Ładowanie portfolio', '<iframe', 'fetch(']) {
  if (html.includes(forbidden)) throw new Error(`Forbidden runtime construct: ${forbidden}`);
}

const out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.cpSync(
  path.join(root, 'osatechgpt_portfolio_assets'),
  path.join(out, 'osatechgpt_portfolio_assets'),
  { recursive: true }
);
console.log('STATIC_PORTFOLIO_BUILD_PASS', html.length);
