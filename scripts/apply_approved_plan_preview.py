from pathlib import Path
import re, subprocess, tempfile

p=Path('plano.html')
t=p.read_text(encoding='utf-8')
orig=t

# 1) CTA do gerador no cabeçalho + ordem de navegação
old_nav='''<nav class="desktop-nav"><a href="#hoje">Hoje</a><a href="#plano">Plano</a><a href="#cronograma">Cronograma</a><a href="#conteudos">Conteúdos</a></nav><span class="plan-chip">PLANO MPC</span>'''
new_nav='''<nav class="desktop-nav"><a href="#hoje">Hoje</a><a href="#plano">Plano</a><a href="#conteudos">Conteúdos</a><a href="#cronograma">Cronograma</a></nav><a class="header-generator-cta" href="/" target="_blank" rel="noopener">CRIAR CRONOGRAMA GRÁTIS</a><span class="plan-chip">PLANO MPC</span>'''
if old_nav not in t: raise SystemExit('Navegação antiga não encontrada')
t=t.replace(old_nav,new_nav,1)

css='''\n/* Ajustes aprovados: CTA do gerador + captura em duas etapas */
.header-generator-cta{margin-left:8px;background:var(--purple);color:#fff;border:1px solid #9b86ff;border-radius:10px;padding:10px 14px;font-size:11px;font-weight:900;white-space:nowrap;box-shadow:0 0 0 1px rgba(255,255,255,.05) inset}.header-generator-cta:hover{filter:brightness(1.08)}.plan-chip{margin-left:2px!important}.capture-card{max-height:calc(100vh - 28px);overflow:auto}.capture-step[hidden]{display:none!important}.capture-card .capture-message{margin:0 0 22px;color:var(--muted);font-size:15px;line-height:1.55}.capture-field{margin-top:16px}.capture-field>label,.capture-legend{display:block;margin-bottom:8px;color:var(--navy3);font-size:13px;font-weight:900}.capture-input{width:100%;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:10px;padding:13px 14px;font-size:16px;outline:none}.capture-input:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(36,200,255,.16)}.capture-options{display:grid;gap:9px}.capture-option{display:flex;align-items:center;gap:10px;padding:12px 13px;border:1px solid var(--line);border-radius:10px;cursor:pointer;color:var(--text);background:#fff}.capture-option:hover{border-color:var(--purple)}.capture-option input{width:18px;height:18px;accent-color:var(--purple)}.capture-whatsapp{width:100%;margin-top:20px}.capture-whatsapp:disabled{opacity:.48;cursor:not-allowed}.capture-unlock{width:100%;margin-top:20px}.capture-code-wrap{text-align:center}.capture-success{position:fixed;left:50%;bottom:26px;z-index:220;transform:translateX(-50%) translateY(30px);opacity:0;pointer-events:none;background:var(--navy);color:#fff;border-left:5px solid var(--green);padding:12px 16px;border-radius:10px;font-size:13px;font-weight:800;transition:.25s}.capture-success.show{opacity:1;transform:translateX(-50%) translateY(0)}
@media(max-width:880px){.header-generator-cta{margin-left:auto;padding:9px 10px;font-size:9px}.plan-chip{display:none}}
@media(max-width:600px){.capture-lock{padding:12px;align-items:flex-end}.capture-card{max-height:92vh;border-radius:18px 18px 10px 10px;padding:22px 18px}.capture-card h2{font-size:27px}.capture-option{padding:11px}.capture-success{width:calc(100% - 24px);text-align:center;bottom:88px}}
'''
t=t.replace('</style>',css+'</style>',1)

old_capture='''<div class="capture-lock" id="captureLock" aria-hidden="true"><section class="capture-card"><div class="capture-brand"><img src="${LOGO}" alt="Professor Lucas MPC"><strong>Professor Lucas MPC</strong></div><h2>Continue acompanhando este plano</h2><p>Para continuar visualizando o cronograma completo, solicite ao Prof. Lucas MPC um código de acesso e digite abaixo.</p><input class="capture-code-input" id="captureCode" maxlength="6" autocomplete="one-time-code" placeholder="A1B2C3"><div class="capture-actions"><button class="capture-unlock" id="captureUnlock" type="button">LIBERAR ACESSO</button><a class="capture-whatsapp" href="${waCrono}" target="_blank">SOLICITAR CÓDIGO PELO WHATSAPP</a></div><div class="capture-error" id="captureError"></div></section></div>'''
new_capture='''<div class="capture-lock" id="captureLock" aria-hidden="true"><section class="capture-card" role="dialog" aria-modal="true" aria-labelledby="captureTitle"><div class="capture-brand"><img src="${LOGO}" alt="Professor Lucas MPC"><strong>Professor Lucas MPC</strong></div><div class="capture-step" id="captureRequestStep"><h2 id="captureTitle">Continue visualizando este cronograma gratuitamente</h2><p class="capture-message">Quer continuar explorando todos os conteúdos e acompanhar o cronograma completo? Informe seu nome, escolha para que você está estudando e receba gratuitamente seu código de acesso pelo WhatsApp.</p><div class="capture-field"><label for="captureName">Nome</label><input class="capture-input" id="captureName" type="text" autocomplete="name" maxlength="100" placeholder="Digite seu nome"></div><fieldset class="capture-field" style="border:0;padding:0;margin-left:0;margin-right:0"><legend class="capture-legend">Você está estudando para:</legend><div class="capture-options"><label class="capture-option"><input type="radio" name="captureInterest" value="Concurso público"><span>Concurso público</span></label><label class="capture-option"><input type="radio" name="captureInterest" value="Vestibular / ENEM"><span>Vestibular / ENEM</span></label><label class="capture-option"><input type="radio" name="captureInterest" value="Outro"><span>Outro</span></label></div></fieldset><button class="capture-whatsapp" id="captureWhatsappBtn" type="button" disabled>SOLICITAR CÓDIGO GRATUITO PELO WHATSAPP</button><div class="capture-error" id="captureFormError" aria-live="polite"></div></div><div class="capture-step capture-code-wrap" id="captureCodeStep" hidden><h2>Digite o código recebido</h2><p class="capture-message">Insira o código de 6 caracteres enviado pelo Prof. Lucas MPC no WhatsApp.</p><div class="capture-field"><label for="captureCode">Código de acesso</label><input class="capture-code-input" id="captureCode" type="text" inputmode="text" maxlength="6" autocomplete="one-time-code" aria-label="Código de acesso de 6 caracteres" placeholder="Código recebido"></div><button class="capture-unlock" id="captureUnlock" type="button">LIBERAR ACESSO</button><div class="capture-error" id="captureError" aria-live="polite"></div></div></section></div><div class="capture-success" id="captureSuccess" aria-live="polite">Acesso liberado neste dispositivo.</div>'''
if old_capture not in t: raise SystemExit('Captura antiga não encontrada')
t=t.replace(old_capture,new_capture,1)

old_js=re.compile(r''' const gateKey=`mpc-public-plan-unlocked:\$\{id\}`;if\(localStorage\.getItem\(gateKey\)!=='1'\)setTimeout\(\(\)=>\{document\.getElementById\('captureLock'\)\?\.classList\.add\('visible'\);document\.body\.classList\.add\('capture-open'\)\},PREVIEW_MS\);\n const code=document\.getElementById\('captureCode'\);code\?\.addEventListener\('input',\(\)=>\{code\.value=code\.value\.toUpperCase\(\)\.replace\(/\[\^A-Z0-9\]/g,''\)\.slice\(0,6\)\}\);document\.getElementById\('captureUnlock'\)\?\.addEventListener\('click',\(\)=>\{const v=code\.value\.trim\(\)\.toUpperCase\(\);if\(!/\^\[A-Z0-9\]\{6\}\$/\.test\(v\)\)\{document\.getElementById\('captureError'\)\.textContent='Digite exatamente 6 letras e/ou números\.';return\}localStorage\.setItem\(gateKey,'1'\);document\.getElementById\('captureLock'\)\.classList\.remove\('visible'\);document\.body\.classList\.remove\('capture-open'\)\}\);''')
new_js=''' const gateKey=`mpc-public-plan-unlocked:${id}`,pendingKey=`mpc-public-plan-whatsapp-pending:${id}`,profileKey=`mpc-public-plan-lead:${id}`;
 const lock=document.getElementById('captureLock'),requestStep=document.getElementById('captureRequestStep'),codeStep=document.getElementById('captureCodeStep'),nameInput=document.getElementById('captureName'),whatsappBtn=document.getElementById('captureWhatsappBtn'),formError=document.getElementById('captureFormError'),code=document.getElementById('captureCode'),unlockBtn=document.getElementById('captureUnlock'),codeError=document.getElementById('captureError'),success=document.getElementById('captureSuccess');
 const isGranted=()=>{try{return localStorage.getItem(gateKey)==='1'}catch{return false}},hasPending=()=>{try{return sessionStorage.getItem(pendingKey)==='1'}catch{return false}};
 function openGate(step='request'){if(isGranted())return;lock?.classList.add('visible');lock?.setAttribute('aria-hidden','false');document.body.classList.add('capture-open');const codeMode=step==='code';if(requestStep)requestStep.hidden=codeMode;if(codeStep)codeStep.hidden=!codeMode;setTimeout(()=>{(codeMode?code:nameInput)?.focus()},120)}
 function closeGate(){lock?.classList.remove('visible');lock?.setAttribute('aria-hidden','true');document.body.classList.remove('capture-open')}
 function selectedInterest(){return document.querySelector('input[name="captureInterest"]:checked')?.value||''}
 function updateWhatsappButton(){if(!whatsappBtn)return;const ready=(nameInput?.value.trim().length||0)>=2&&!!selectedInterest();whatsappBtn.disabled=!ready;if(ready&&formError)formError.textContent=''}
 try{const saved=JSON.parse(localStorage.getItem(profileKey)||'null');if(saved?.name&&nameInput)nameInput.value=saved.name;if(saved?.interest){const radio=[...document.querySelectorAll('input[name="captureInterest"]')].find(r=>r.value===saved.interest);if(radio)radio.checked=true}}catch{}
 updateWhatsappButton();nameInput?.addEventListener('input',updateWhatsappButton);document.querySelectorAll('input[name="captureInterest"]').forEach(r=>r.addEventListener('change',updateWhatsappButton));
 whatsappBtn?.addEventListener('click',()=>{const name=nameInput?.value.trim()||'',interest=selectedInterest();if(name.length<2||!interest){if(formError)formError.textContent='Preencha seu nome e marque uma opção para continuar.';return}const pageUrl=location.href.split('#')[0];const message=`Olá, professor Lucas! Meu nome é ${name} e vim da página ${pageUrl}.\n\nEstou estudando para: ${interest}.\n\nPoderia me enviar o código gratuito de acesso?`;try{localStorage.setItem(profileKey,JSON.stringify({name,interest}));sessionStorage.setItem(pendingKey,'1')}catch{}location.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`});
 function showCodeAfterReturn(){if(!isGranted()&&hasPending())openGate('code')}
 code?.addEventListener('input',()=>{code.value=code.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(codeError)codeError.textContent=''});code?.addEventListener('keydown',e=>{if(e.key==='Enter')unlockBtn?.click()});
 unlockBtn?.addEventListener('click',()=>{const v=(code?.value||'').trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(v)){if(codeError)codeError.textContent='Digite exatamente 6 letras e/ou números.';code?.focus();return}try{localStorage.setItem(gateKey,'1');sessionStorage.removeItem(pendingKey)}catch{}closeGate();success?.classList.add('show');setTimeout(()=>success?.classList.remove('show'),2600)});
 if(!isGranted()){if(hasPending())openGate('code');else{let visibleAccumulated=0,visibleStartedAt=document.visibilityState==='visible'?performance.now():null,timer=null;const remainingMs=()=>Math.max(0,PREVIEW_MS-visibleAccumulated-(visibleStartedAt===null?0:performance.now()-visibleStartedAt));const scheduleGate=()=>{clearTimeout(timer);if(document.visibilityState!=='visible'||isGranted()||hasPending())return;const remaining=remainingMs();if(remaining<=0){openGate('request');return}timer=setTimeout(()=>openGate('request'),remaining)};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(visibleStartedAt!==null){visibleAccumulated+=performance.now()-visibleStartedAt;visibleStartedAt=null}clearTimeout(timer);return}if(hasPending()){showCodeAfterReturn();return}visibleStartedAt=performance.now();scheduleGate()});window.addEventListener('pageshow',showCodeAfterReturn);window.addEventListener('focus',()=>{if(hasPending())showCodeAfterReturn()});scheduleGate()}}
'''
t,n=old_js.subn(lambda m:new_js,t,count=1)
if n!=1: raise SystemExit(f'JS antigo da captura não encontrado ({n})')

map_start=t.find('<section class="section" id="conteudos">')
cron_start=t.find('<section class="section" id="cronograma">')
if map_start<0 or cron_start<0: raise SystemExit('Seções mapa/cronograma não encontradas')
if map_start>cron_start:
    def section_end(s,start):
        e=s.find('</section>',start)
        if e<0: raise SystemExit('Fim de seção não encontrado')
        return e+len('</section>')
    cron_end=section_end(t,cron_start);map_start=t.find('<section class="section" id="conteudos">',cron_end);map_end=section_end(t,map_start)
    before=t[:cron_start];cron=t[cron_start:cron_end];between=t[cron_end:map_start];mapp=t[map_start:map_end];after=t[map_end:]
    t=before+mapp+between+cron+after

checks=['CRIAR CRONOGRAMA GRÁTIS','Continue visualizando este cronograma gratuitamente','Você está estudando para:','value="Outro"','Poderia me enviar o código gratuito de acesso?','PREVIEW_MS=60000','Código recebido']
for x in checks:
    if x not in t: raise SystemExit('Faltou: '+x)
for forbidden in ['A1B2C3','Continue acompanhando este plano','TESTAR CAPTURA']:
    if forbidden in t: raise SystemExit('Ainda presente: '+forbidden)
if t.index('Mapa de matérias e conteúdos')>t.index('Cronograma de execução'): raise SystemExit('Mapa ainda está depois do cronograma')
if t==orig: raise SystemExit('Nenhuma alteração aplicada')
p.write_text(t,encoding='utf-8')

scripts=re.findall(r'<script(?:[^>]*)>(.*?)</script>',t,re.S)
main=max(scripts,key=len)
with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as f: f.write(main); fn=f.name
subprocess.run(['node','--check',fn],check=True)
print('Correções aprovadas aplicadas e JavaScript validado.')
