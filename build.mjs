import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const names = [
  'html-01.b64','html-02.b64','html-03.b64','html-04.b64','html-05.b64','html-06.b64','html-07.b64','html-08.b64','html-09.b64',
  'html-10a.b64','html-10b.b64','html-11a.b64','html-11b.b64','html-12a.b64','html-12b.b64','html-13a.b64','html-13b.b64','html-14.b64'
];
const encoded = names.map((name) => fs.readFileSync(path.join(root, '.static', name), 'utf8').trim()).join('');
const html = Buffer.from(encoded, 'base64').toString('utf8');

const required = ['Agent Proof Runtime', 'mini-audit-form', 'social-grid', 'id="lightning"'];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
for (const forbidden of ['Ładowanie portfolio', '<iframe', 'fetch(']) {
  if (html.includes(forbidden)) throw new Error(`Forbidden runtime construct: ${forbidden}`);
}
if ((html.match(/class="project-card"/g) || []).length !== 4) {
  throw new Error('Expected exactly four project cards');
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
console.log('STATIC_PORTFOLIO_BUILD_PASS', Buffer.byteLength(html));
