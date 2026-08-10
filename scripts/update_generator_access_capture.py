from pathlib import Path
import re

index_path=Path('index.html')
plan_path=Path('plano.html')
index=index_path.read_text('utf-8')
plan=plan_path.read_text('utf-8')

MARK='/* MPC generator access capture v2 */'

# Reutiliza a mesma logo já presente na página pública aprovada.
logo_match=re.search(r'<img[^>]+src="(data:image/(?:webp|png|jpeg);base64,[^"]+)"',plan,re.I)
if not logo_match:
    logo_match=re.search(r'<link[^>]+rel="icon"[^>]+href="(data:image/(?:webp|png|jpeg);base64,[^"]+)"',index,re.I)
if not logo_match:
    raise SystemExit('Logo MPC não encontrada para a captura.')
logo_src=logo_match.group(1)

css=f'''\n{MARK}\n.access-modal-shell.mpc-capture-v2{{max-width:660px;padding:30px 34px 28px;border:1px solid #E4E8F0;border-top:6px solid #8A5CFF;border-radius:20px;max-height:min(88vh,780px);overflow:auto;background:#fff;color:#172033;box-shadow:0 28px 80px rgba(5,18,37,.32)}}\n.mpc-capture-v2 .access-brand{{display:flex;align-items:center;gap:14px;margin-bottom:20px}}\n.mpc-capture-v2 .access-brand-logo{{width:60px;height:60px;border-radius:12px;object-fit:cover;background:#071225;box-shadow:0 6px 18px rgba(7,18,37,.14)}}\n.mpc-capture-v2 .access-brand strong{{font-size:19px;color:#071225;letter-spacing:-.01em}}\n.mpc-capture-v2 .access-request-view,.mpc-capture-v2 .access-code-only-view{{display:grid;gap:15px;padding:0}}\n.mpc-capture-v2 .access-request-view[hidden],.mpc-capture-v2 .access-code-only-view[hidden]{{display:none!important}}\n.mpc-capture-v2 .access-capture-title{{font-family:Georgia,'Times New Roman',serif;font-size:clamp(30px,4vw,42px);line-height:1.06;letter-spacing:-.025em;color:#071225;margin:0}}\n.mpc-capture-v2 .access-capture-copy{{font-size:17px;line-height:1.55;color:#657086;margin:0 0 4px}}\n.mpc-capture-v2 .access-field{{display:grid;gap:7px}}\n.mpc-capture-v2 .access-field label,.mpc-capture-v2 .access-legend{{font-weight:900;color:#071225;font-size:14px}}\n.mpc-capture-v2 .access-name-input,.mpc-capture-v2 .access-code-input{{width:100%;min-height:56px;border:1px solid #D8DFEA;border-radius:11px;padding:0 14px;background:#fff;color:#172033;font:inherit;outline:none}}\n.mpc-capture-v2 .access-code-input{{text-align:center;text-transform:uppercase;letter-spacing:.28em;font-size:22px;font-weight:900}}\n.mpc-capture-v2 .access-name-input:focus,.mpc-capture-v2 .access-code-input:focus{{border-color:#24C8FF;box-shadow:0 0 0 3px rgba(36,200,255,.14)}}\n.mpc-capture-v2 .access-options{{display:grid;gap:9px}}\n.mpc-capture-v2 .access-option{{display:flex;align-items:center;gap:12px;min-height:58px;padding:12px 16px;border:1px solid #E4E8F0;border-radius:11px;background:#fff;cursor:pointer;font-size:16px;color:#172033}}\n.mpc-capture-v2 .access-option:hover{{border-color:#B8C5D8;background:#FAFBFD}}\n.mpc-capture-v2 .access-option input{{width:20px;height:20px;accent-color:#8A5CFF;flex:0 0 auto}}\n.mpc-capture-v2 .access-whatsapp-btn,.mpc-capture-v2 .access-unlock-btn{{width:100%;min-height:56px;border:0;border-radius:11px;padding:12px 16px;font-weight:950;font-size:14px;cursor:pointer;transition:.18s ease}}\n.mpc-capture-v2 .access-whatsapp-btn{{background:#31B77A;color:#fff}}\n.mpc-capture-v2 .access-unlock-btn{{background:#4C7DFF;color:#fff}}\n.mpc-capture-v2 .access-whatsapp-btn:hover:not(:disabled),.mpc-capture-v2 .access-unlock-btn:hover{{filter:brightness(.96);transform:translateY(-1px)}}\n.mpc-capture-v2 .access-whatsapp-btn:disabled{{opacity:.45;cursor:not-allowed;transform:none}}\n.mpc-capture-v2 .registration-submit-status{{min-height:20px;margin:0;text-align:center;font-size:13px}}\n@media(max-width:680px){{.access-modal-shell.mpc-capture-v2{{width:calc(100% - 24px);padding:24px 20px 22px;border-radius:17px}}.mpc-capture-v2 .access-brand-logo{{width:52px;height:52px}}.mpc-capture-v2 .access-capture-copy{{font-size:15px}}}}\n'''
if MARK not in index:
    pos=index.find('</style>')
    if pos<0: raise SystemExit('Bloco de estilo principal não encontrado.')
    index=index[:pos]+css+index[pos:]

start=index.find('  <!-- Liberação de acesso por código manual -->')
if start<0: raise SystemExit('Início da captura antiga não encontrado.')
end=index.find('  <script>',start)
if end<0: raise SystemExit('Fim da captura antiga não encontrado.')

block=f'''  <!-- Liberação de acesso por código manual -->\n  <div class="modal-backdrop required-modal" id="accessModal" data-required="true" aria-hidden="true">\n    <div class="modal access-modal-shell mpc-capture-v2" role="dialog" aria-modal="true" aria-labelledby="accessTitle">\n      <div class="access-brand">\n        <img class="access-brand-logo" src="{logo_src}" alt="Logo Professor Lucas MPC">\n        <strong>Professor Lucas MPC</strong>\n      </div>\n\n      <div class="access-request-view" id="accessRequestView">\n        <h2 class="access-capture-title" id="accessTitle">Você está prestes a criar seu cronograma gratuitamente</h2>\n        <p class="access-capture-copy">Quer iniciar a criação do seu cronograma personalizado e explorar todos os recursos do Gerador de Cronograma MPC? Informe seu nome, escolha seu objetivo de estudos e solicite gratuitamente seu código de acesso pelo WhatsApp.</p>\n\n        <div class="access-field">\n          <label for="accessNameInput">Nome</label>\n          <input class="access-name-input" id="accessNameInput" type="text" autocomplete="name" maxlength="100" placeholder="Digite seu nome">\n        </div>\n\n        <fieldset class="access-field" style="border:0;padding:0;margin:0">\n          <legend class="access-legend">Você está estudando para:</legend>\n          <div class="access-options">\n            <label class="access-option"><input type="radio" name="accessInterest" value="Concurso público"><span>Concurso público</span></label>\n            <label class="access-option"><input type="radio" name="accessInterest" value="Vestibular / ENEM"><span>Vestibular / ENEM</span></label>\n            <label class="access-option"><input type="radio" name="accessInterest" value="Outro"><span>Outro</span></label>\n          </div>\n        </fieldset>\n\n        <button class="access-whatsapp-btn" id="accessWhatsappBtn" type="button" disabled>SOLICITAR CÓDIGO GRATUITO PELO WHATSAPP</button>\n        <p class="registration-submit-status" id="accessRequestStatus" role="status" aria-live="polite"></p>\n      </div>\n\n      <div class="access-code-only-view" id="accessCodeView" hidden>\n        <h2 class="access-capture-title">Digite o código recebido</h2>\n        <p class="access-capture-copy">Insira abaixo o código de 6 caracteres enviado pelo Prof. Lucas MPC no WhatsApp.</p>\n        <div class="access-field">\n          <label for="accessCodeInput">Código de acesso</label>\n          <input class="access-code-input" id="accessCodeInput" type="text" inputmode="text" autocomplete="one-time-code" maxlength="6" pattern="[A-Za-z0-9]{{6}}" aria-describedby="accessCodeStatus">\n        </div>\n        <button class="access-unlock-btn" id="accessCodeBtn" type="button">LIBERAR ACESSO AO GERADOR</button>\n        <p class="registration-submit-status" id="accessCodeStatus" role="status" aria-live="polite"></p>\n      </div>\n    </div>\n  </div>\n\n'''
index=index[:start]+block+index[end:]

helpers='''    const ACCESS_PENDING_KEY='mpcGeneratorAccessWhatsappPending';\n    const ACCESS_PROFILE_KEY='mpcGeneratorAccessLeadProfile';\n    function selectedAccessInterest(){\n      return document.querySelector('input[name="accessInterest"]:checked')?.value||'';\n    }\n    function readAccessLeadProfile(){\n      try{return JSON.parse(localStorage.getItem(ACCESS_PROFILE_KEY)||'{}')}catch{return {}}\n    }\n    function saveAccessLeadProfile(){\n      const profile={name:String(el('accessNameInput')?.value||'').trim(),interest:selectedAccessInterest()};\n      try{localStorage.setItem(ACCESS_PROFILE_KEY,JSON.stringify(profile))}catch{}\n      return profile;\n    }\n    function accessPending(){try{return sessionStorage.getItem(ACCESS_PENDING_KEY)==='1'}catch{return false}}\n    function updateAccessWhatsappButton(){\n      const btn=el('accessWhatsappBtn');if(!btn)return;\n      const ready=String(el('accessNameInput')?.value||'').trim().length>=2&&!!selectedAccessInterest();\n      btn.disabled=!ready;\n      if(ready&&el('accessRequestStatus'))el('accessRequestStatus').textContent='';\n    }\n    function showAccessRequestStep(){\n      const request=el('accessRequestView'),code=el('accessCodeView');\n      if(request)request.hidden=false;if(code)code.hidden=true;\n      const p=readAccessLeadProfile(),name=el('accessNameInput');\n      if(name&&!name.value&&p.name)name.value=p.name;\n      if(p.interest){const radio=document.querySelector(`input[name="accessInterest"][value="${CSS.escape(p.interest)}"]`);if(radio)radio.checked=true}\n      updateAccessWhatsappButton();setTimeout(()=>name?.focus(),120);\n    }\n    function showAccessCodeStep(){\n      const request=el('accessRequestView'),code=el('accessCodeView'),input=el('accessCodeInput');\n      if(request)request.hidden=true;if(code)code.hidden=false;\n      if(input)input.value='';\n      if(el('accessCodeStatus')){el('accessCodeStatus').textContent='';el('accessCodeStatus').className='registration-submit-status'}\n      setTimeout(()=>input?.focus(),120);\n    }\n    function renderAccessGate(){\n      if(accessPending())showAccessCodeStep();else showAccessRequestStep();\n    }\n\n    function accessWhatsappMessage(){\n      const p=saveAccessLeadProfile();\n      const pageUrl=location.href.split('#')[0];\n      return `Olá, professor Lucas! Meu nome é ${p.name}. Estou estudando para: ${p.interest}. Gostaria de receber gratuitamente meu código de acesso ao Gerador de Cronograma MPC.\\n\\nPágina: ${pageUrl}`;\n    }\n\n'''
pattern=r'    function renderAccessGate\(\)\{.*?    function accessWhatsappMessage\(\)\{.*?\n    \}\n\n(?=    function renderPrivacyConsent)'
index,n=re.subn(pattern,helpers,index,count=1,flags=re.S)
if n!=1: raise SystemExit('Funções antigas da captura não foram substituídas.')

old_handler=re.compile(r"      el\('accessWhatsappBtn'\)\.onclick=\(\)=>\{.*?      \};",re.S)
new_handler='''      el('accessNameInput')?.addEventListener('input',updateAccessWhatsappButton);\n      document.querySelectorAll('input[name="accessInterest"]').forEach(r=>r.addEventListener('change',updateAccessWhatsappButton));\n      el('accessWhatsappBtn').onclick=()=>{\n        const profile=saveAccessLeadProfile();\n        const status=el('accessRequestStatus');\n        if(profile.name.length<2||!profile.interest){\n          if(status){status.className='registration-submit-status error';status.textContent='Preencha seu nome e escolha uma opção para continuar.'}\n          updateAccessWhatsappButton();return;\n        }\n        try{sessionStorage.setItem(ACCESS_PENDING_KEY,'1')}catch{}\n        const msg=accessWhatsappMessage();\n        location.href=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;\n      };\n      const showCodeAfterWhatsappReturn=()=>{if(platformAccessRequired()&&accessPending())showAccessCodeStep()};\n      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')showCodeAfterWhatsappReturn()});\n      window.addEventListener('pageshow',showCodeAfterWhatsappReturn);\n      window.addEventListener('focus',showCodeAfterWhatsappReturn);'''
index,n=old_handler.subn(new_handler,index,count=1)
if n!=1: raise SystemExit('Handler antigo do WhatsApp não encontrado.')

needle='''        state.registered=true;\n        state.awaitingWhatsapp=false;'''
replacement='''        state.registered=true;\n        try{sessionStorage.removeItem(ACCESS_PENDING_KEY)}catch{}\n        const accessProfile=readAccessLeadProfile();\n        state.registration={...(state.registration||{}),name:accessProfile.name||'',studyInterest:accessProfile.interest||''};\n        state.awaitingWhatsapp=false;'''
if needle not in index: raise SystemExit('Ponto de liberação do acesso não encontrado.')
index=index.replace(needle,replacement,1)

# Requisitos finais da captura nova.
checks=[
 'Você está prestes a criar seu cronograma gratuitamente',
 'Você está estudando para:',
 'SOLICITAR CÓDIGO GRATUITO PELO WHATSAPP',
 'Digite o código recebido',
 'ACCESS_PENDING_KEY',
 'value="Outro"'
]
for x in checks:
    assert x in index,x
assert 'placeholder="A1B2C3"' not in index
assert '<div class="access-code-only-view" id="accessCodeView" hidden>' in index

index_path.write_text(index,'utf-8')
print('Captura do Gerador MPC atualizada e validada.')
