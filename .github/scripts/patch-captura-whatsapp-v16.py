from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

def sub(pattern,new,label):
    global s
    rx=re.compile(pattern,re.S)
    s2,n=rx.subn(lambda m:new,s,count=1)
    if n!=1:
        raise SystemExit(f'{label}: esperado 1, encontrado {n}')
    s=s2

# Exige acesso desde a entrada, não depois de cinco ações.
rep("function platformAccessRequired(){ return !adminUnlocked() && state.actionCount >= 5 && !state.registered; }",
    "function platformAccessRequired(){ return !adminUnlocked() && !state.registered; }",
    'platformAccessRequired')

# A tela obrigatória passa a ser somente a de solicitação/validação do código.
sub(r"    function enforceAccessGate\(\)\{.*?\n    \}\n    function toast",
'''    function enforceAccessGate(){
      if(!platformAccessRequired()){
        setAccessLock(false);
        return;
      }
      document.querySelectorAll('.modal-backdrop.open').forEach(m=>{
        if(m.id!=='accessModal'){
          m.classList.remove('open');
          m.setAttribute('aria-hidden','true');
        }
      });
      renderAccessGate();
      openModal('accessModal');
    }
    function toast''','enforceAccessGate')

# Novo conteúdo da primeira tela de acesso.
sub(r"      <!-- Tela 1: solicitação do código -->\n      <div class=\"access-content\" id=\"accessRequestView\">.*?      </div>\n\n      <!-- Tela 2: apenas validação do código -->",
'''      <!-- Tela 1: solicitação do código -->
      <div class="access-content" id="accessRequestView">
        <div class="access-icon" aria-hidden="true">🔐</div>
        <div class="notice">
          <strong>Para usar o Gerador de Cronogramas MPC GRATUITAMENTE, solicite seu código de acesso ao professor Lucas através do WhatsApp.</strong>
        </div>
        <div class="field">
          <label for="accessNameInput">Seu nome</label>
          <input id="accessNameInput" type="text" autocomplete="name" maxlength="100" placeholder="Digite seu nome">
        </div>
        <div class="access-steps">
          <div class="access-step"><strong>1</strong><span>Digite seu nome.</span></div>
          <div class="access-step"><strong>2</strong><span>Clique no botão abaixo e envie a mensagem pronta pelo WhatsApp.</span></div>
          <div class="access-step"><strong>3</strong><span>Ao receber o código, volte a esta página e informe os 6 números.</span></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="accessWhatsappBtn" type="button">Solicitar código pelo WhatsApp</button>
        </div>
        <p class="registration-submit-status" id="accessRequestStatus" role="status" aria-live="polite"></p>
        <p class="access-number">Prof. Lucas MPC: (11) 96018-9699</p>
      </div>

      <!-- Tela 2: apenas validação do código -->''','accessRequestView')

rep('<h2 id="accessTitle">Etapa 2: solicite seu código</h2>',
    '<h2 id="accessTitle">Acesso gratuito ao Gerador MPC</h2>',
    'accessTitle html')

# Renderiza nome na primeira etapa e mantém segunda etapa após abrir WhatsApp.
sub(r"    function renderAccessGate\(\)\{.*?\n    \}\n\n\n    function createUnlockCode",
'''    function renderAccessGate(){
      const requestView=el('accessRequestView');
      const codeView=el('accessCodeView');
      const title=el('accessTitle');
      const input=el('accessCodeInput');
      const nameInput=el('accessNameInput');
      const status=el('accessCodeStatus');
      const codeStage=Boolean(state.awaitingWhatsapp && state.whatsappOpened && state.registration?.unlockCodeHash);

      if(requestView) requestView.hidden=codeStage;
      if(codeView) codeView.hidden=!codeStage;
      if(title) title.textContent=codeStage ? 'Digite o código recebido' : 'Acesso gratuito ao Gerador MPC';

      if(!codeStage){
        if(nameInput && !nameInput.value && state.registration?.name) nameInput.value=state.registration.name;
        if(input) input.value='';
        if(status){
          status.textContent='';
          status.className='registration-submit-status';
        }
        setTimeout(()=>nameInput?.focus(),120);
      }else{
        setTimeout(()=>input?.focus(),120);
      }
    }


    function createUnlockCode''','renderAccessGate')

# Mensagem exatamente conforme solicitado.
sub(r"    function accessWhatsappMessage\(\)\{.*?\n    \}",
'''    function accessWhatsappMessage(){
      const name=String(state.registration?.name||'').trim();
      return `Olá, professor Lucas MPC. Gostaria de usar o gerador de cronogramas MPC GRATUITAMENTE. Poderia me enviar o meu código de acesso? Meu nome é: ${name}`;
    }''','accessWhatsappMessage')

# O botão do WhatsApp agora cria o código, registra internamente no Netlify Forms e abre a mensagem.
sub(r"      el\('accessWhatsappBtn'\)\.onclick=\(\)=>\{.*?      \};\n      el\('adminPinInput'\)",
'''      el('accessWhatsappBtn').onclick=async()=>{
        const name=String(el('accessNameInput')?.value||'').trim();
        const status=el('accessRequestStatus');
        const button=el('accessWhatsappBtn');
        if(name.length<2){
          status.className='registration-submit-status error';
          status.textContent='Digite seu nome antes de solicitar o código.';
          el('accessNameInput')?.focus();
          return;
        }

        const form=el('registerForm');
        const unlockCode=createUnlockCode();
        const unlockCodeHash=await hashUnlockCode(unlockCode);
        const leadId=cryptoId();
        const createdAt=new Date().toISOString();
        if(el('regName')) el('regName').value=name;
        if(el('regEmail')) el('regEmail').value='';
        if(el('regWhatsapp')) el('regWhatsapp').value='';
        if(el('privacyConsent')) el('privacyConsent').checked=false;
        if(el('marketingConsent')) el('marketingConsent').checked=false;
        form.dataset.leadId=leadId;
        fillRegistrationMetadata({leadId,createdAt,privacyAcceptedAt:'',marketing:false,unlockCode});

        button.disabled=true;
        status.className='registration-submit-status sending';
        status.textContent='Preparando seu código de acesso...';
        try{
          await submitRegistrationToNetlify(form);
          state.registered=false;
          state.awaitingWhatsapp=true;
          state.whatsappOpened=true;
          state.registration={
            leadId,
            unlockCodeHash,
            name,
            createdAt,
            whatsappRequestedAt:createdAt,
            netlifyCapturedAt:new Date().toISOString()
          };
          saveState();
          const msg=accessWhatsappMessage();
          renderAccessGate();
          window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
          toast('Envie a mensagem e aguarde seu código de liberação.');
        }catch(error){
          console.error('Falha ao preparar pedido de acesso:',error);
          status.className='registration-submit-status error';
          status.textContent='Não foi possível preparar seu código agora. Verifique sua conexão e tente novamente.';
        }finally{
          button.disabled=false;
        }
      };
      el('adminPinInput')''','accessWhatsappBtn')

# Remove a exigência de ter passado pelo formulário antigo para validar.
rep("if(!state.whatsappOpened){\n          toast('Primeiro abra o WhatsApp e envie a mensagem.');\n          return;\n        }",
    "if(!state.awaitingWhatsapp || !state.registration?.unlockCodeHash){\n          toast('Primeiro solicite seu código pelo WhatsApp.');\n          renderAccessGate();\n          return;\n        }",
    'validação prévia do código')

# O cadastro antigo continua no HTML apenas como formulário técnico do Netlify, mas nunca é mostrado pelo novo fluxo.
# Atualiza os principais textos legais visíveis para refletir a captura imediata.
s=s.replace('Depois de cinco ações, o site solicita nome, e-mail e WhatsApp. O cadastro é enviado para a área privada do projeto na Netlify antes do direcionamento ao WhatsApp.',
            'Ao entrar na plataforma pela primeira vez, o site solicita o nome para preparar um código individual de acesso. O pedido é registrado na área privada do projeto na Netlify antes do direcionamento ao WhatsApp.',1)
s=s.replace('Depois de cinco ações, o cadastro e o direcionamento ao WhatsApp são apresentados como condição para continuar usando gratuitamente a plataforma.',
            'Na primeira entrada, a solicitação do código e o direcionamento ao WhatsApp são apresentados como condição para liberar gratuitamente a plataforma.',1)

p.write_text(s,encoding='utf-8')
print('PATCH_CAPTURA_WHATSAPP_V16_OK')
