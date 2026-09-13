from pathlib import Path
import subprocess

EXPECTED_BASELINE_BLOB = 'ac232ca596b6f56c8e85d82b198d5af759e65780'
index_path = Path('index.html')
source = index_path.read_text(encoding='utf-8')
actual_blob = subprocess.check_output(['git','hash-object','index.html'], text=True).strip()
if actual_blob != EXPECTED_BASELINE_BLOB:
    raise SystemExit(f'ABORT: unexpected baseline blob {actual_blob}')

old_css = '.oxf-art img{position:absolute;z-index:1;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 46%;filter:saturate(1.06) contrast(1.03) brightness(.96);transform:scale(1.01)}'
new_css = '.oxf-art img{position:absolute;z-index:1;left:50%;top:50%;width:min(72%,360px);height:auto;max-height:90%;object-fit:contain;object-position:center;filter:none;transform:translate(-50%,-50%);image-rendering:auto}'
if source.count(old_css) != 1:
    raise SystemExit('ABORT: static OSA CSS anchor mismatch')
source = source.replace(old_css, new_css, 1)

privacy_styles = '''
<style id="osa-privacy-cookie-styles">
.osa-footer-bottom a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(23,16,6,.25)}
.osa-footer-bottom a:hover{color:#171006;border-bottom-color:currentColor}
.osa-cookie-banner{position:fixed;z-index:9999;left:20px;right:20px;bottom:20px;max-width:920px;margin:0 auto;padding:16px 18px;border:1px solid rgba(224,177,85,.45);border-radius:14px;background:rgba(8,10,15,.97);box-shadow:0 24px 80px rgba(0,0,0,.55);backdrop-filter:blur(16px);color:#f5f2ea;display:none;align-items:center;justify-content:space-between;gap:18px}
.osa-cookie-banner[data-open="true"]{display:flex}
.osa-cookie-copy{font:500 12px/1.55 var(--grote,system-ui,sans-serif);color:rgba(255,255,255,.72)}
.osa-cookie-copy strong{display:block;margin-bottom:3px;color:#fff;font-size:13px}
.osa-cookie-copy a{color:var(--acc,#e0b155);text-decoration:none;border-bottom:1px solid rgba(224,177,85,.35)}
.osa-cookie-actions{display:flex;gap:8px;flex:0 0 auto}
.osa-cookie-actions button{appearance:none;border:1px solid var(--acc,#e0b155);background:var(--acc,#e0b155);color:#080a0f;border-radius:8px;padding:10px 14px;font:700 9px var(--mono,monospace);letter-spacing:.04em;cursor:pointer}
@media(max-width:680px){.osa-cookie-banner{left:10px;right:10px;bottom:10px;align-items:stretch;flex-direction:column}.osa-cookie-actions button{width:100%}}
</style>
'''
if source.count('</head>') != 1:
    raise SystemExit('ABORT: head anchor mismatch')
source = source.replace('</head>', privacy_styles + '</head>', 1)

old_footer = '<div class="osa-footer-bottom"><span>© 2026 Bartosz Osiński · OsaTechGPT.dev</span><span>BUILD · VERIFY · DEPLOY</span></div>'
new_footer = '<div class="osa-footer-bottom"><span>© 2026 Bartosz Osiński · OsaTechGPT.dev</span><span>BUILD · VERIFY · DEPLOY · <a href="/privacy.html">PRYWATNOŚĆ &amp; COOKIES</a></span></div>'
if source.count(old_footer) != 1:
    raise SystemExit('ABORT: footer anchor mismatch')
source = source.replace(old_footer, new_footer, 1)

banner = '''
<div class="osa-cookie-banner" id="osa-cookie-banner" role="dialog" aria-label="Informacja o cookies" aria-live="polite" data-open="false">
  <div class="osa-cookie-copy"><strong>Cookies bez śledzenia.</strong>OsaTechGPT.dev nie używa cookies reklamowych ani analitycznych. Jedno niezbędne cookie zapamiętuje tylko zamknięcie tego komunikatu. Zewnętrzne fonty są pobierane z Google Fonts. <a href="/privacy.html">Polityka prywatności</a>.</div>
  <div class="osa-cookie-actions"><button id="osa-cookie-ack" type="button">ROZUMIEM</button></div>
</div>
<script id="osa-cookie-notice">
(function(){
  const name='osa_cookie_notice';
  const read=()=>document.cookie.split('; ').find(row=>row.startsWith(name+'='))?.split('=')[1]||'';
  const banner=document.getElementById('osa-cookie-banner');
  if(!banner)return;
  if(!read())banner.dataset.open='true';
  document.getElementById('osa-cookie-ack')?.addEventListener('click',()=>{
    document.cookie=name+'=acknowledged; Path=/; Max-Age=15552000; SameSite=Lax; Secure';
    banner.dataset.open='false';
  });
})();
</script>
'''
if source.count('</body>') != 1:
    raise SystemExit('ABORT: body anchor mismatch')
source = source.replace('</body>', banner + '</body>', 1)
index_path.write_text(source, encoding='utf-8', newline='')

privacy = '''<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>Polityka prywatności i cookies · OsaTechGPT.dev</title>
<style>
:root{color-scheme:dark;--bg:#07080c;--panel:#0d1017;--text:#f3f0e9;--muted:#a7a19a;--gold:#e0b155;--line:rgba(224,177,85,.25)}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 10%,rgba(224,177,85,.08),transparent 30%),var(--bg);color:var(--text);font:16px/1.7 system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(880px,calc(100% - 32px));margin:0 auto;padding:64px 0 80px}.brand{font:800 13px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;color:var(--gold)}h1{margin:14px 0 12px;font-size:clamp(34px,6vw,58px);line-height:1;letter-spacing:-.045em}h2{margin:34px 0 8px;font-size:20px}p,li{color:var(--muted)}a{color:var(--gold)}.card{margin-top:28px;padding:24px;border:1px solid var(--line);border-radius:16px;background:rgba(13,16,23,.88)}.back{display:inline-flex;margin-top:28px;padding:11px 14px;border:1px solid var(--line);border-radius:9px;text-decoration:none;font:700 11px ui-monospace,SFMono-Regular,Consolas,monospace}.stamp{margin-top:36px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:#777}
</style>
</head>
<body><main class="wrap">
<div class="brand">OSATECHGPT.DEV · PRIVACY</div>
<h1>Polityka prywatności i cookies</h1>
<p>Ta strona została zaprojektowana tak, aby działać bez reklamowego i analitycznego śledzenia użytkownika.</p>
<div class="card">
<h2>1. Administrator i kontakt</h2>
<p>Administratorem danych związanych z kontaktem przez OsaTechGPT.dev jest Bartosz Osiński / OsaTechGPT.dev. Kontakt: <a href="mailto:osabarca@gmail.com">osabarca@gmail.com</a>.</p>
<h2>2. Jakie dane mogą być przetwarzane</h2>
<p>Samo przeglądanie strony nie uruchamia analityki ani reklamowych trackerów. Infrastruktura dostarczająca stronę może technicznie przetwarzać m.in. adres IP, datę i czas żądania, typ przeglądarki oraz podstawowe logi bezpieczeństwa potrzebne do dostarczenia i ochrony serwisu.</p>
<p>Formularz mini audytu nie wysyła danych do backendu OsaTechGPT.dev. Po jego użyciu strona przygotowuje wiadomość przez <code>mailto:</code>; dane trafiają do administratora dopiero, gdy użytkownik sam wyśle tę wiadomość ze swojego klienta e-mail.</p>
<h2>3. Cookies</h2>
<p>OsaTechGPT.dev nie ustawia obecnie cookies analitycznych, reklamowych ani profilujących. Strona może ustawić jedno funkcjonalne cookie <code>osa_cookie_notice=acknowledged</code> na maksymalnie 180 dni wyłącznie po to, aby zapamiętać zamknięcie komunikatu o cookies.</p>
<h2>4. Zewnętrzne zasoby i linki</h2>
<p>Strona pobiera fonty z Google Fonts (<code>fonts.googleapis.com</code> i <code>fonts.gstatic.com</code>). Przy takim żądaniu dostawca zewnętrzny może otrzymać techniczne dane połączenia, takie jak adres IP i informacje przeglądarki. Kliknięcie linków do GitHub, LinkedIn, Instagram, YouTube, TikTok lub innych zewnętrznych serwisów powoduje przejście do usług działających na własnych zasadach prywatności.</p>
<h2>5. Cele i podstawy przetwarzania</h2>
<p>Dane techniczne mogą być przetwarzane w celu dostarczenia i zabezpieczenia serwisu na podstawie prawnie uzasadnionego interesu. Dane przesłane dobrowolnie e-mailem są przetwarzane w celu odpowiedzi na zapytanie, podjęcia działań przed zawarciem umowy lub prowadzenia relacji biznesowej, zależnie od kontekstu wiadomości.</p>
<h2>6. Okres przechowywania</h2>
<p>Dane z korespondencji są przechowywane tylko tak długo, jak jest to potrzebne do obsługi zapytania, współpracy, obowiązków prawnych lub obrony roszczeń. Retencja technicznych logów zależy od konfiguracji używanej infrastruktury hostingowej i bezpieczeństwa.</p>
<h2>7. Prawa użytkownika</h2>
<p>W zakresie przewidzianym przez RODO można żądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania lub wnieść sprzeciw. Można także złożyć skargę do właściwego organu nadzorczego ds. ochrony danych.</p>
<h2>8. Zmiany polityki</h2>
<p>Jeżeli na stronie zostanie uruchomiona analityka, marketing, nowe formularze backendowe lub inne mechanizmy przetwarzania danych, polityka zostanie odpowiednio zaktualizowana.</p>
</div>
<a class="back" href="/">← WRÓĆ DO OSATECHGPT.DEV</a>
<div class="stamp">Wersja: 13.09.2026</div>
</main></body></html>
'''
Path('privacy.html').write_text(privacy, encoding='utf-8', newline='')

print('PATCH_APPLIED')
print('INDEX_BYTES', index_path.stat().st_size)
print('PRIVACY_BYTES', Path('privacy.html').stat().st_size)
