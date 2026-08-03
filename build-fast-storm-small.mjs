import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = process.env.SOURCE_FILE;
const sourceUrl = 'https://raw.githubusercontent.com/HazEOskA/OsaTechGPT.dev/0a4ad8e7b4529141e34085302c7246be1132bc6b/index.html';
let html;
if (sourcePath) {
  html = fs.readFileSync(sourcePath, 'utf8');
} else {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'osatechgpt-static-builder' } });
  if (!response.ok) throw new Error(`Source fetch failed: ${response.status}`);
  html = await response.text();
}

html = html.replace(
  /\/\* FINAL BACKGROUND LOCK: original landing \+ lightning only \*\/[\s\S]*?(?=\/\* PROJECT MEDIA GALLERIES \*\/)/,
  ''
);
html = html.replace('href="#status">Poznaj kompetencje</a>', 'href="#oferta">Zobacz ofertę</a>');

const aprCard = `
      <article class="client-project-card">
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

let agenticReplacements = 0;
html = html.replace(/<article class="client-project-card">[\s\S]*?<\/article>/g, (card) => {
  if (!card.includes('agentic-dashboard.jpg')) return card;
  agenticReplacements += 1;
  return aprCard;
});
if (agenticReplacements !== 1) throw new Error(`Expected one Agentic City card, replaced ${agenticReplacements}`);

const footerCss = `
/* PREMIUM SOCIAL FOOTER */
/* No synthetic diagonal rain lines: preserve original clouds, haze and lightning only. */
.storm-rain{display:none!important}
.apr-project-media img{object-fit:contain!important;background:#05090a}
.osa-footer{position:relative;overflow:hidden;margin-top:52px;padding:58px 0 26px;border-top:1px solid rgba(255,255,255,.13);background:linear-gradient(180deg,rgba(3,5,9,.36),rgba(3,4,7,.97));color:#fff}
.osa-footer:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 0%,rgba(0,229,255,.09),transparent 34%),radial-gradient(circle at 82% 0%,rgba(224,177,85,.09),transparent 34%)}
.osa-footer-inner{position:relative;z-index:1;width:min(1180px,calc(100% - 38px));margin:auto}
.osa-footer-head{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:40px;align-items:end}
.osa-footer-brand{font-size:clamp(32px,5vw,62px);font-weight:900;letter-spacing:-.06em;line-height:.95}.osa-footer-brand span{color:var(--acc,#e0b155)}
.osa-footer-copy{margin-top:17px;max-width:660px;color:rgba(255,255,255,.63);line-height:1.7}
.osa-footer-contact{padding:22px;border:1px solid rgba(224,177,85,.24);border-radius:18px;background:rgba(10,12,18,.76);box-shadow:0 24px 70px rgba(0,0,0,.28)}
.osa-footer-contact strong{display:block;font-size:20px}.osa-footer-contact p{margin:8px 0 0;color:rgba(255,255,255,.6);line-height:1.55}
.osa-footer-contact a{display:inline-flex;margin-top:16px;padding:11px 15px;border-radius:10px;background:var(--acc,#e0b155);color:#08090c;font-weight:900;text-decoration:none}
.osa-social-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-top:38px}
.osa-social{--social:#fff;position:relative;min-height:166px;padding:20px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:linear-gradient(155deg,rgba(18,21,31,.94),rgba(7,8,12,.98));color:#fff;text-decoration:none;overflow:hidden;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}
.osa-social:after{content:"";position:absolute;width:120px;height:120px;right:-48px;top:-52px;border-radius:50%;background:var(--social);opacity:.08;transition:.22s}
.osa-social:hover,.osa-social:focus-visible{transform:translateY(-5px);border-color:var(--social);box-shadow:0 18px 50px rgba(0,0,0,.28);outline:none}.osa-social:hover:after{opacity:.16;transform:scale(1.18)}
.osa-social-icon{width:47px;height:47px;display:grid;place-items:center;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16)}
.osa-social-icon svg{width:25px;height:25px;fill:currentColor}.osa-social-name{display:block;margin-top:24px;font-size:16px;font-weight:900}.osa-social-handle{display:block;margin-top:5px;color:rgba(255,255,255,.48);font:500 10px var(--mono,monospace);letter-spacing:.07em;overflow-wrap:anywhere}
.osa-social.github{--social:#f1f1f1}.osa-social.linkedin{--social:#0a66c2}.osa-social.instagram{--social:#e1306c}.osa-social.x{--social:#f5f5f5}.osa-social.facebook{--social:#1877f2}.osa-social.pending{opacity:.48;cursor:not-allowed}.osa-social.pending:hover{transform:none;box-shadow:none;border-color:rgba(255,255,255,.11)}
.osa-footer-bottom{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:38px;padding-top:22px;border-top:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.42);font:500 10px var(--mono,monospace);letter-spacing:.08em}
@media(max-width:900px){.osa-footer-head{grid-template-columns:1fr}.osa-social-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.osa-social-grid{grid-template-columns:1fr}.osa-footer-inner{width:min(100% - 28px,1180px)}}
`;
html = html.replace('</style>', `${footerCss}\n</style>`);

const fastStormCss = `
/* FAST WHITE STORM LOCK — black background, no diagonal rain, smooth continuous motion */
html,body{background:#000!important}
.hero{background:#000!important}
.storm-premium,.storm-base{background:#000!important}
.storm-rain,.storm-city{display:none!important}
.storm-cloud{filter:grayscale(1) blur(32px)!important;will-change:transform,opacity}
.storm-cloud.c1{animation-duration:14s!important;opacity:.42!important}
.storm-cloud.c2{animation-duration:19s!important;opacity:.28!important}
.storm-cloud.c3{animation-duration:24s!important;opacity:.18!important}
.storm-haze{animation-duration:9s!important;opacity:.22!important}
.storm-lightning{display:block!important;opacity:1!important;mix-blend-mode:screen;filter:drop-shadow(0 0 5px rgba(255,255,255,.95)) drop-shadow(0 0 18px rgba(255,255,255,.48))!important;will-change:contents}
.storm-flash{display:block!important;animation:none!important;opacity:0;background:radial-gradient(ellipse 48% 70% at 58% 8%,rgba(255,255,255,.28),transparent 70%)!important;will-change:opacity}
`;
html = html.replace('</style>', `${fastStormCss}\n</style>`);

const lightningStart = html.indexOf('// ── procedural premium lightning');
const lightningEnd = lightningStart < 0 ? -1 : html.indexOf('})();', lightningStart) + 5;
if (lightningStart < 0 || lightningEnd < 5) throw new Error('Original lightning runtime not found');
const fastLightning = `// ── FAST WHITE STORM: continuous, smooth, no rain stripes ──
(function(){
  const canvas=document.querySelector('.storm-lightning');
  const host=document.querySelector('.storm-premium');
  const flashEl=document.querySelector('.storm-flash');
  if(!canvas||!host||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  let dpr=1,w=1,h=1,groups=[],nextStrike=0,last=performance.now();
  function resize(){
    const r=host.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,1.5);w=Math.max(1,r.width);h=Math.max(1,r.height);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function makePath(startX,endY,spread){
    const pts=[{x:startX,y:-10}];let x=startX,y=-10;
    while(y<endY){const step=16+Math.random()*25;y+=step;x+=(Math.random()-.5)*(spread+step*.56);pts.push({x,y});}
    return pts;
  }
  function createStrike(t,secondary=false){
    const startX=w*(.12+Math.random()*.76),main=makePath(startX,h*(.54+Math.random()*.34),secondary?17:23);
    const paths=[{points:main,width:secondary?1.05:1.35,alpha:secondary?.72:1,start:0}];
    for(let i=3;i<main.length-3;i++)if(Math.random()<(secondary?.055:.105)){
      const p=main[i],dir=Math.random()<.5?-1:1,branch=[{x:p.x,y:p.y}];let x=p.x,y=p.y;
      const steps=3+Math.floor(Math.random()*4);
      for(let j=0;j<steps;j++){x+=dir*(12+Math.random()*20);y+=11+Math.random()*18;branch.push({x,y});}
      paths.push({points:branch,width:.62,alpha:.38,start:i/main.length});
    }
    groups.push({paths,born:t,life:secondary?410:520});if(groups.length>4)groups.shift();
  }
  function drawPartial(points,progress,width,alpha){
    if(progress<=0||alpha<=.002)return;
    const max=(points.length-1)*Math.min(1,progress),whole=Math.floor(max),frac=max-whole;
    ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
    for(let i=1;i<=whole;i++)ctx.lineTo(points[i].x,points[i].y);
    if(whole<points.length-1){const a=points[whole],b=points[whole+1];ctx.lineTo(a.x+(b.x-a.x)*frac,a.y+(b.y-a.y)*frac);}
    ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=alpha*.32;ctx.strokeStyle='#fff';ctx.lineWidth=width*5.2;ctx.shadowBlur=18;ctx.shadowColor='rgba(255,255,255,.9)';ctx.stroke();
    ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.shadowBlur=4;ctx.strokeStyle='#fff';ctx.stroke();
  }
  function frame(t){
    const dt=Math.min(34,t-last);last=t;void dt;ctx.clearRect(0,0,w,h);
    if(!nextStrike)nextStrike=t+120;
    if(t>=nextStrike){createStrike(t,false);if(Math.random()<.56)createStrike(t+95+Math.random()*90,true);nextStrike=t+380+Math.random()*620;}
    let flash=0;groups=groups.filter(g=>t-g.born<g.life+120);
    for(const g of groups){
      const age=t-g.born;if(age<0)continue;
      const reveal=Math.min(1,age/88),fade=age<105?1:Math.max(0,1-(age-105)/(g.life-105));
      const pulse=age>145&&age<205?Math.sin((age-145)/60*Math.PI)*.34:0,alpha=Math.min(1,fade*fade+pulse);
      flash=Math.max(flash,alpha);
      for(const p of g.paths){const local=Math.max(0,(reveal-p.start)/(1-p.start||1));drawPartial(p.points,local,p.width,alpha*p.alpha);}
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;if(flashEl)flashEl.style.opacity=String(Math.min(.24,flash*.20));requestAnimationFrame(frame);
  }
  resize();addEventListener('resize',resize,{passive:true});requestAnimationFrame(frame);
})();`;
html = html.slice(0, lightningStart) + fastLightning + html.slice(lightningEnd);

const footer = `<footer class="osa-footer" aria-label="Stopka OsaTechGPT"><div class="osa-footer-inner"><div class="osa-footer-head"><div><div class="osa-footer-brand">OSA<span>TECHGPT</span>.DEV</div><p class="osa-footer-copy">Buduję systemy AI, aplikacje, automatyzacje i bezpieczne runtime’y od architektury po działający deployment i dowód wykonania.</p></div><div class="osa-footer-contact"><strong>Masz proces, który blokuje firmę?</strong><p>Pełny formularz mini audytu znajduje się bezpośrednio powyżej. Firmowy e-mail oraz automatyczną wysyłkę podłączymy po uruchomieniu Workspace.</p><a href="#kontakt">PRZEJDŹ DO MINI AUDYTU ↑</a></div></div><div class="osa-social-grid" aria-label="Profile społecznościowe">
<a class="osa-social github" href="https://github.com/HazEOskA" target="_blank" rel="noopener noreferrer"><span class="osa-social-icon">GH</span><span class="osa-social-name">GitHub</span><span class="osa-social-handle">@HazEOskA</span></a>
<a class="osa-social linkedin" href="https://www.linkedin.com/in/bartosz-osi%C5%84ski-689490385" target="_blank" rel="noopener noreferrer"><span class="osa-social-icon">in</span><span class="osa-social-name">LinkedIn</span><span class="osa-social-handle">Bartosz Osiński</span></a>
<a class="osa-social instagram" href="https://www.instagram.com/osatechgpt/" target="_blank" rel="noopener noreferrer"><span class="osa-social-icon">IG</span><span class="osa-social-name">Instagram</span><span class="osa-social-handle">@osatechgpt</span></a>
<span class="osa-social x pending" aria-disabled="true"><span class="osa-social-icon">X</span><span class="osa-social-name">X</span><span class="osa-social-handle">LINK DO PODPIĘCIA</span></span>
<span class="osa-social facebook pending" aria-disabled="true"><span class="osa-social-icon">f</span><span class="osa-social-name">Facebook</span><span class="osa-social-handle">LINK DO PODPIĘCIA</span></span>
</div><div class="osa-footer-bottom"><span>© 2026 Bartosz Osiński · OsaTechGPT.dev</span><span>BUILD · VERIFY · DEPLOY</span></div></div></footer>`;

const oldFooterPattern = /<footer class="site-footer">[\s\S]*?<\/footer>/;
if (!oldFooterPattern.test(html)) throw new Error('Original footer not found');
html = html.replace(oldFooterPattern, footer);

html = html.replace(/mailto:[^"'\s>]+/gi, '#kontakt');
html = html.replace(
  '</body>',
  `<script id="audit-workspace-guard">document.getElementById('mini-audit-form')?.addEventListener('submit',function(event){event.preventDefault();const status=this.querySelector('.form-status')||this.appendChild(document.createElement('p'));status.className='form-status';status.textContent='Formularz jest widoczny i gotowy. Wysyłkę oraz firmowy e-mail podłączymy po uruchomieniu Workspace.';});</script></body>`
);

const required = [
  'class="storm-premium"',
  'FAST WHITE STORM: continuous, smooth',
  'class="reel-v"',
  'class="corridor"',
  'Agent Proof Runtime',
  'apr-mission-control.jpg',
  'id="mini-audit-form"',
  'class="osa-footer"'
];
for (const marker of required) {
  if (!html.includes(marker)) throw new Error(`Missing required marker: ${marker}`);
}
for (const forbidden of ['Ładowanie portfolio', '<iframe']) {
  if (html.includes(forbidden)) throw new Error(`Forbidden construct in final HTML: ${forbidden}`);
}
if ((html.match(/class="client-project-card"/g) || []).length !== 4) {
  throw new Error('Expected exactly four project cards');
}

const out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.cpSync(path.join(root, 'osatechgpt_portfolio_assets'), path.join(out, 'osatechgpt_portfolio_assets'), { recursive: true });
console.log('RESTORED_ORIGINAL_HERO_AND_STORM_PASS', Buffer.byteLength(html));
