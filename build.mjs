import fs from 'node:fs';
import path from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const root = process.cwd();
const parts = ['01','02','03'].map((n) =>
  fs.readFileSync(path.join(root, '.static', `portfolio-${n}.br.b64`), 'utf8').trim()
);
const html = brotliDecompressSync(Buffer.from(parts.join(''), 'base64')).toString('utf8');

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
