import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = 'https://raw.githubusercontent.com/HazEOskA/OsaTechGPT.dev/0a4ad8e7b4529141e34085302c7246be1132bc6b/index.html';
const response = await fetch(source, { headers: { 'user-agent': 'osatechgpt-static-builder' } });
if (!response.ok) throw new Error(`Source fetch failed: ${response.status}`);
let html = await response.text();

// Restore the exact approved storm/background from the first preview.
html = html.replace(/\/\* FINAL BACKGROUND LOCK: original landing \+ lightning only \*\/[\s\S]*?(?=\/\* PROJECT MEDIA GALLERIES \*\/)/, '');
html = html.replace('href="#status">Poznaj kompetencje</a>', 'href="#oferta">Zobacz ofertę</a>');

const apr = `<article class="client-project-card">
  <div class="project-media apr-project-media" data-gallery>
    <div class="media-track">
      <figure class="media-slide active"><img src="osatechgpt_portfolio_assets/apr-mission-control.jpg" alt="Agent Proof Runtime — Mission Control"></figure>
      <figure class="media-slide"><img src="osatechgpt_portfolio_assets/apr-audit-verifier.jpg" alt="Agent Proof Runtime — Audit i Verifier"></figure>
    </div>
    <button class="media-nav media-prev" aria-label="Poprzedni screenshot APR">‹</button>
    <button class="media-nav media-next" aria-label="Następny screenshot APR">›</button>
    <span class="media-label">Agent Proof Runtime</span><span class="media-count">1 / 2</span>
  </div>
  <div class="project-status">LOCAL_VERIFIED · PRIVATE REPO</div>
  <h3>Agent Proof Runtime</h3>
  <p>Kontrolowane misje AI z Mission Studio, orkiestracją agentów, deterministycznym evidence, Proof Bundle, niezależnym verifierem i Tamper Lab.</p>
  <div class="project-actions"><a href="https://apr-osatechgpt-landing.vercel.app" target="_blank" rel="noopener">ZOBACZ APR ↗</a></div>
</article>`;
let replaced = 0;
html = html.replace(/<article class="client-project-card">[\s\S]*?<\/article>/g, card => {
  if (!card.includes('agentic-dashboard.jpg')) return card;
  replaced++;
  return apr;
});
if (replaced !== 1) throw new Error(`APR replacement count: ${replaced}`);

const footerCss = `<style id="osa-footer-css">
.apr-project-media img{object-fit:contain!important;background:#05090a}.osa-footer{position:relative;z-index:20;padding:58px 0 26px;border-top:1px solid rgba(255,255,255,.13);background:rgba(3,4,7,.96);color:#fff}.osa-footer-inner{width:min(1180px,calc(100% - 38px));margin:auto}.osa-footer-head{display:grid;grid-template-columns:1.1fr .9fr;gap:34px;align-items:end}.osa-footer-brand{font-size:clamp(32px,5vw,62px);font-weight:900;letter-spacing:-.06em}.osa-footer-brand span{color:var(--acc,#e0b155)}.osa-footer-copy,.osa-footer-contact p{color:rgba(255,255,255,.64);line-height:1.65}.osa-footer-contact{padding:22px;border:1px solid rgba(224,177,85,.24);border-radius:18px;background:rgba(10,12,18,.82)}.osa-footer-contact a{display:inline-flex;margin-top:12px;padding:11px 15px;border-radius:10px;background:var(--acc,#e0b155);color:#08090c;font-weight:900;text-decoration:none}.osa-social-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-top:34px}.osa-social{--c:#fff;min-height:154px;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:linear-gradient(155deg,rgba(18,21,31,.94),rgba(7,8,12,.98));color:#fff;text-decoration:none;transition:.2s}.osa-social:hover{transform:translateY(-4px);border-color:var(--c)}.osa-social svg{width:25px;height:25px;fill:currentColor}.osa-social .icon{width:46px;height:46px;display:grid;place-items:center;border-radius:13px;border:1px solid rgba(255,255,255,.18)}.osa-social strong{display:block;margin-top:20px}.osa-social small{display:block;margin-top:5px;color:#7f8794;font:600 9px var(--mono,monospace)}.osa-social.github{--c:#eee}.osa-social.linkedin{--c:#0a66c2}.osa-social.instagram{--c:#e1306c}.osa-social.x{--c:#eee}.osa-social.facebook{--c:#1877f2}.osa-social.pending{opacity:.45;cursor:not-allowed}.osa-footer-bottom{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:34px;padding-top:20px;border-top:1px solid rgba(255,255,255,.1);color:#6f7785;font:700 9px var(--mono,monospace)}@media(max-width:900px){.osa-footer-head{grid-template-columns:1fr}.osa-social-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.osa-social-grid{grid-template-columns:1fr}}
</style>`;
html = html.replace('</head>', footerCss + '</head>');

const icon = {
  github:'<path d="M12 .7a11.3 11.3 0 0 0-3.57 22.03c.57.1.77-.25.77-.55v-2.16c-3.15.69-3.81-1.34-3.81-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.74.4-1.24.72-1.52-2.51-.29-5.15-1.26-5.15-5.59 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.44.11-3 0 0 .95-.31 3.11 1.16a10.8 10.8 0 0 1 5.66 0C15.05 5.39 16 5.7 16 5.7c.62 1.56.23 2.71.11 3 .73.79 1.17 1.8 1.17 3.04 0 4.34-2.65 5.3-5.17 5.58.41.35.77 1.04.77 2.1v2.76c0 .3.21.66.78.55A11.3 11.3 0 0 0 12 .7Z"/>',
  linkedin:'<path d="M5.3 3.5A2.8 2.8 0 1 1 5.3 9.1a2.8 2.8 0 0 1 0-5.6ZM3 10.7h4.7V21H3V10.7Zm7.8 0h4.5v1.4h.1c.6-1.2 2.2-2.5 4.5-2.5 4.8 0 5.7 3.2 5.7 7.4v4H21v-3.5c0-.8 0-1.9-1.1-1.9-1.2 0-1.4.9-1.4 1.8V21h-4.7V10.7Z" transform="scale(.86) translate(1.4 1.5)"/>',
  instagram:'<path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm10.3 1.5a1.3 1.3 0 1 1 0 2.5 1.3 1.3 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>',
  x:'<path d="M18.2 2H21l-6 6.9L22 22h-5.5l-4.3-5.6L7.3 22H4.5l6.4-7.3L4.2 2h5.6l3.9 5.1L18.2 2Zm-1 17.7h1.6L9 4.2H7.4l9.8 15.5Z"/>',
  facebook:'<path d="M22 12.1C22 6.5 17.5 2 12 2S2 6.5 2 12.1C2 17.1 5.7 21.2 10.4 22v-7H7.9v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9h2.8l-.4 2.9h-2.4v7c4.8-.8 8.5-4.9 8.5-9.9Z"/>'
};
const tile=(cls,name,handle,href)=>`${href?`<a href="${href}" target="_blank" rel="noopener noreferrer"`:`<span`} class="osa-social ${cls}${href?'':' pending'}"><span class="icon"><svg viewBox="0 0 24 24">${icon[cls]}</svg></span><strong>${name}</strong><small>${handle}</small>${href?'</a>':'</span>'}`;
const footer=`<footer class="osa-footer"><div class="osa-footer-inner"><div class="osa-footer-head"><div><div class="osa-footer-brand">OSA<span>TECHGPT</span>.DEV</div><p class="osa-footer-copy">Systemy AI, aplikacje, automatyzacje i bezpieczne runtime’y — od architektury po działający deployment i dowód wykonania.</p></div><div class="osa-footer-contact"><strong>Masz proces, który blokuje firmę?</strong><p>Pełny formularz mini audytu znajduje się bezpośrednio powyżej. Firmowy e-mail podłączymy po uruchomieniu Workspace.</p><a href="#kontakt">PRZEJDŹ DO MINI AUDYTU ↑</a></div></div><div class="osa-social-grid">${tile('github','GitHub','@HazEOskA','https://github.com/HazEOskA')}${tile('linkedin','LinkedIn','Bartosz Osiński','https://www.linkedin.com/in/bartosz-osi%C5%84ski-689490385')}${tile('instagram','Instagram','@osatechgpt','https://www.instagram.com/osatechgpt/')}${tile('x','X','URL DO PODPIĘCIA','')}${tile('facebook','Facebook','URL DO PODPIĘCIA','')}</div><div class="osa-footer-bottom"><span>© 2026 Bartosz Osiński · OsaTechGPT.dev</span><span>BUILD · VERIFY · DEPLOY</span></div></div></footer>`;
if (!/<footer class="site-footer">[\s\S]*?<\/footer>/.test(html)) throw new Error('Original footer missing');
html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer);
html = html.replace(/mailto:[^"'\s>]+/gi, '#kontakt');
html = html.replace('</body>', `<script>document.getElementById('mini-audit-form')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;let s=f.querySelector('.form-status');if(!s){s=document.createElement('p');s.className='form-status';f.appendChild(s)}s.textContent='Formularz jest widoczny i gotowy. Wysyłkę oraz firmowy e-mail podłączymy po uruchomieniu Workspace.'});</script></body>`);

for (const marker of ['class="storm-premium"','class="reel-v"','class="corridor"','Agent Proof Runtime','apr-mission-control.jpg','id="mini-audit-form"','class="osa-footer"']) if (!html.includes(marker)) throw new Error(`Missing ${marker}`);
for (const forbidden of ['Ładowanie portfolio','<iframe']) if (html.includes(forbidden)) throw new Error(`Forbidden ${forbidden}`);
if ((html.match(/class="client-project-card"/g)||[]).length!==4) throw new Error('Expected four project cards');

const out=path.join(root,'public');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.cpSync(path.join(root,'osatechgpt_portfolio_assets'),path.join(out,'osatechgpt_portfolio_assets'),{recursive:true});
console.log('APPROVED_FIRST_PREVIEW_RESTORED',Buffer.byteLength(html));
