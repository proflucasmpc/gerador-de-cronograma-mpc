from pathlib import Path
import re

root = Path('.')
index_path = root / 'index.html'
admin_path = root / 'admin.html'
area_path = root / 'area-usuario.html'
guided_path = root / 'guided-user.js'

if not index_path.exists() or not area_path.exists() or not guided_path.exists():
    raise SystemExit('Arquivos essenciais não encontrados.')

current_index = index_path.read_text('utf-8')
area_html = area_path.read_text('utf-8')
guided_js = guided_path.read_text('utf-8')

# Preserva a versão administrativa completa. Em reexecuções, reutiliza admin.html
# para nunca substituir a área administrativa pela nova página do usuário.
if admin_path.exists() and 'id="adminPanel"' in admin_path.read_text('utf-8'):
    legacy_admin = admin_path.read_text('utf-8')
else:
    legacy_admin = current_index

if 'id="adminPanel"' not in legacy_admin or 'adminRouteRequested' not in legacy_admin:
    raise SystemExit('A interface administrativa original não foi reconhecida.')

# admin.html não deve executar nenhum redirecionamento da área pública.
admin_html = legacy_admin.replace('  <script src="/guided-bridge.js"></script>\n', '')
admin_html = admin_html.replace('  <script src="/guided-bridge.js" defer></script>\n', '')
admin_html = admin_html.replace('<script src="/guided-bridge.js"></script>', '')
admin_html = admin_html.replace('<script src="/guided-bridge.js" defer></script>', '')

old_admin_route = """    function adminRouteRequested(){
      return new URLSearchParams(location.search).get('admin')==='1';
    }"""
new_admin_route = """    function adminRouteRequested(){
      const byQuery=new URLSearchParams(location.search).get('admin')==='1';
      const byPath=/\\/admin(?:\\.html)?$/.test(location.pathname);
      return byQuery||byPath;
    }"""
if old_admin_route in admin_html:
    admin_html = admin_html.replace(old_admin_route, new_admin_route, 1)
elif "const byPath=/\\/admin(?:\\.html)?$/.test(location.pathname);" not in admin_html:
    raise SystemExit('Não foi possível adaptar a rota administrativa.')

admin_path.write_text(admin_html, 'utf-8')

# A raiz passa a ser a nova área do usuário. A checagem ocorre no <head> para
# visitantes sem acesso não verem a interface antes de irem para /acesso.html.
access_guard = """<script id="mpc-root-access-guard">
(()=>{
  try{
    const data=JSON.parse(localStorage.getItem('geradorCronogramaMpcData')||'{}');
    if(!data.registered) location.replace('/acesso.html');
  }catch{location.replace('/acesso.html')}
})();
</script>"""
root_html = area_html
if 'id="mpc-root-access-guard"' not in root_html:
    root_html = root_html.replace('</head>', access_guard + '\n</head>', 1)
root_html = root_html.replace('<title>Área do Usuário · Gerador de Cronograma MPC</title>', '<title>Gerador de Cronograma MPC · Professor Lucas MPC</title>')
index_path.write_text(root_html, 'utf-8')

# A área guiada, tanto na raiz quanto no endereço antigo, manda visitantes sem
# liberação para uma página de acesso dedicada — nunca para a página antiga.
guided_js = guided_js.replace("if(!readAccess().registered){location.replace('/');return;}", "if(!readAccess().registered){location.replace('/acesso.html');return;}")
if "location.replace('/acesso.html')" not in guided_js:
    raise SystemExit('Redirecionamento de acesso da área guiada não foi aplicado.')
guided_path.write_text(guided_js, 'utf-8')

access_html = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,follow">
<title>Liberar acesso · Gerador de Cronograma MPC</title>
<style>
:root{--navy:#071225;--navy2:#102541;--cyan:#24c8ff;--purple:#8a5cff;--green:#31b77a;--bg:#f4f7fb;--text:#172033;--muted:#687287;--line:#dfe5ef}*{box-sizing:border-box}body{margin:0;min-height:100svh;background:linear-gradient(150deg,#071225 0,#102541 42%,#f4f7fb 42%);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:var(--text);display:grid;place-items:center;padding:24px}.card{width:min(650px,100%);background:#fff;border:1px solid var(--line);border-top:6px solid var(--purple);border-radius:20px;padding:30px;box-shadow:0 28px 80px #0004}.brand{display:flex;gap:12px;align-items:center;margin-bottom:18px}.mark{width:50px;height:50px;border-radius:14px;background:var(--navy);color:var(--cyan);display:grid;place-items:center;font-weight:950}.brand strong{display:block;color:var(--navy);font-size:18px}.brand small{color:var(--muted)}h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(31px,6vw,43px);line-height:1.05;color:var(--navy);margin:0 0 12px}p{color:var(--muted);line-height:1.6}.view{display:grid;gap:15px}.view[hidden]{display:none!important}.field{display:grid;gap:7px}.field label,.legend{font-size:13px;font-weight:900;color:var(--navy)}input[type=text]{width:100%;min-height:55px;border:1px solid #cfd8e5;border-radius:11px;padding:0 14px;font:inherit;outline:none}input[type=text]:focus{border-color:var(--cyan);box-shadow:0 0 0 3px #24c8ff24}.options{display:grid;gap:9px}.option{display:flex;align-items:center;gap:11px;padding:13px 15px;border:1px solid var(--line);border-radius:11px;cursor:pointer}.option input{width:20px;height:20px;accent-color:var(--purple)}button{border:0;border-radius:11px;min-height:55px;padding:12px 16px;font:inherit;font-weight:950;cursor:pointer}.whatsapp{background:var(--green);color:#fff}.unlock{background:#4c7dff;color:#fff}.secondary{background:#eef2f7;color:#46546a}.whatsapp:disabled{opacity:.45;cursor:not-allowed}.code{letter-spacing:.28em;text-align:center;text-transform:uppercase;font-size:22px;font-weight:900}.status{min-height:20px;margin:0;text-align:center;font-size:13px}.error{color:#b42318}.hint{font-size:12px;background:#f7f9fc;border:1px solid var(--line);padding:11px;border-radius:9px}@media(max-width:600px){body{padding:12px;background:var(--navy)}.card{padding:23px 18px;border-radius:17px}}
</style>
<script>
(()=>{try{const d=JSON.parse(localStorage.getItem('geradorCronogramaMpcData')||'{}');if(d.registered)location.replace('/')}catch{}})();
</script>
</head>
<body>
<main class="card">
  <div class="brand"><div class="mark">MPC</div><div><strong>Professor Lucas MPC</strong><small>Gerador de Cronograma MPC</small></div></div>
  <section class="view" id="requestView">
    <div><h1>Libere seu acesso gratuito</h1><p>Informe seu nome, escolha seu objetivo de estudos e solicite seu código gratuito pelo WhatsApp. Depois, volte a esta página e digite o código recebido.</p></div>
    <div class="field"><label for="name">Nome</label><input id="name" type="text" maxlength="100" autocomplete="name" placeholder="Digite seu nome"></div>
    <fieldset class="field" style="border:0;padding:0;margin:0"><legend class="legend">Você está estudando para:</legend><div class="options"><label class="option"><input type="radio" name="interest" value="Concurso público"> Concurso público</label><label class="option"><input type="radio" name="interest" value="Vestibular / ENEM"> Vestibular / ENEM</label><label class="option"><input type="radio" name="interest" value="Outro"> Outro</label></div></fieldset>
    <button class="whatsapp" id="whatsapp" disabled>SOLICITAR CÓDIGO GRATUITO PELO WHATSAPP</button>
    <button class="secondary" id="already">JÁ TENHO UM CÓDIGO</button>
    <p class="status" id="requestStatus"></p>
  </section>
  <section class="view" id="codeView" hidden>
    <div><h1>Digite o código recebido</h1><p>Insira o código de 6 caracteres enviado pelo Prof. Lucas MPC.</p></div>
    <div class="field"><label for="code">Código de acesso</label><input class="code" id="code" type="text" maxlength="6" autocomplete="one-time-code" inputmode="text"></div>
    <button class="unlock" id="unlock">LIBERAR ACESSO AO GERADOR</button>
    <button class="secondary" id="back">VOLTAR</button>
    <p class="status" id="codeStatus"></p>
    <div class="hint">O acesso fica salvo neste navegador. Depois da liberação, o endereço principal abrirá diretamente a nova área do usuário.</div>
  </section>
</main>
<script>
(()=>{
'use strict';
const KEY='geradorCronogramaMpcData',PENDING='mpcGeneratorAccessWhatsappPending',PROFILE='mpcGeneratorAccessLeadProfile',WHATSAPP='5511960189699';
const el=id=>document.getElementById(id),request=el('requestView'),codeView=el('codeView');
function read(k,storage=localStorage){try{return JSON.parse(storage.getItem(k)||'{}')}catch{return {}}}
function profile(){return {name:el('name').value.trim(),interest:document.querySelector('input[name="interest"]:checked')?.value||''}}
function saveProfile(){const p=profile();localStorage.setItem(PROFILE,JSON.stringify(p));return p}
function pending(){try{return sessionStorage.getItem(PENDING)==='1'}catch{return false}}
function showCode(){request.hidden=true;codeView.hidden=false;el('codeStatus').textContent='';setTimeout(()=>el('code').focus(),80)}
function showRequest(){request.hidden=false;codeView.hidden=true;const p=read(PROFILE);if(p.name&&!el('name').value)el('name').value=p.name;if(p.interest){const r=[...document.querySelectorAll('input[name="interest"]')].find(x=>x.value===p.interest);if(r)r.checked=true}update()}
function update(){const p=profile();el('whatsapp').disabled=p.name.length<2||!p.interest}
el('name').addEventListener('input',update);document.querySelectorAll('input[name="interest"]').forEach(r=>r.addEventListener('change',update));
el('already').onclick=showCode;el('back').onclick=showRequest;
el('whatsapp').onclick=()=>{const p=saveProfile();if(p.name.length<2||!p.interest){el('requestStatus').className='status error';el('requestStatus').textContent='Preencha seu nome e escolha uma opção.';return}try{sessionStorage.setItem(PENDING,'1')}catch{}const msg=`Olá, professor Lucas! Meu nome é ${p.name}. Estou estudando para: ${p.interest}. Gostaria de receber gratuitamente meu código de acesso ao Gerador de Cronograma MPC.\n\nPágina: ${location.origin}/`;location.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`};
function unlock(){const value=el('code').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(!/^[A-Z0-9]{6}$/.test(value)){el('codeStatus').className='status error';el('codeStatus').textContent='Digite um código com exatamente 6 letras e/ou números.';return}const state=read(KEY);const p=read(PROFILE);state.registered=true;state.awaitingWhatsapp=false;state.whatsappOpened=false;state.whatsappReturned=false;state.registration={...(state.registration||{}),name:p.name||'',studyInterest:p.interest||'',accessMode:'manual-code',unlockedAt:new Date().toISOString()};localStorage.setItem(KEY,JSON.stringify(state));try{sessionStorage.removeItem(PENDING)}catch{}location.replace('/')}
el('unlock').onclick=unlock;el('code').addEventListener('input',e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6));el('code').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
const returned=()=>{if(pending())showCode()};document.addEventListener('visibilitychange',()=>{if(!document.hidden)returned()});window.addEventListener('pageshow',returned);window.addEventListener('focus',returned);
if(pending())showCode();else showRequest();
})();
</script>
</body>
</html>'''
(root / 'acesso.html').write_text(access_html, 'utf-8')

# Validações estruturais essenciais
checks = [
    ('index.html', 'id="mpc-root-access-guard"'),
    ('index.html', '<script src="/guided-user.js"></script>'),
    ('admin.html', 'id="adminPanel"'),
    ('admin.html', "const byPath=/\\/admin(?:\\.html)?$/.test(location.pathname);"),
    ('acesso.html', 'SOLICITAR CÓDIGO GRATUITO PELO WHATSAPP'),
    ('acesso.html', "location.replace('/')"),
    ('guided-user.js', "location.replace('/acesso.html')"),
]
for filename, marker in checks:
    text=(root/filename).read_text('utf-8')
    if marker not in text:
        raise SystemExit(f'Validação falhou: {filename} não contém {marker!r}')
if 'guided-bridge.js' in admin_path.read_text('utf-8'):
    raise SystemExit('admin.html ainda contém guided-bridge.js')
if 'id="adminPanel"' in index_path.read_text('utf-8'):
    raise SystemExit('A raiz ainda contém a interface administrativa antiga.')

print('Rotas separadas: raiz do usuário, acesso dedicado e administração preservada em /admin.html.')
