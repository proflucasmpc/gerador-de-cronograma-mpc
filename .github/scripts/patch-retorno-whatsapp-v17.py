from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

# Estado separado: abrir WhatsApp não significa que o usuário já voltou.
rep(
"      whatsappOpened: false,\n      privacyAcknowledged: false,",
"      whatsappOpened: false,\n      whatsappReturned: false,\n      privacyAcknowledged: false,",
'estado whatsappReturned'
)

# Chaves de sessão para detectar uma saída real da página e o retorno posterior.
rep(
"    const ADMIN_VIEW_KEY = 'geradorCronogramaMpcAdminView';\n",
"    const ADMIN_VIEW_KEY = 'geradorCronogramaMpcAdminView';\n    const ACCESS_WHATSAPP_PENDING_KEY = 'geradorCronogramaMpcWhatsappPending';\n    const ACCESS_WHATSAPP_LEFT_KEY = 'geradorCronogramaMpcWhatsappLeft';\n    const ACCESS_WHATSAPP_LAUNCH_AT_KEY = 'geradorCronogramaMpcWhatsappLaunchAt';\n",
'chaves whatsapp retorno'
)

# O campo de código só aparece depois do retorno confirmado.
rep(
"      const codeStage=Boolean(state.awaitingWhatsapp && state.whatsappOpened && state.registration?.unlockCodeHash);",
"      const codeStage=Boolean(state.awaitingWhatsapp && state.whatsappOpened && state.whatsappReturned && state.registration?.unlockCodeHash);",
'codeStage retorno'
)

# Helpers para detectar ida/volta do WhatsApp sem trocar a tela no clique.
anchor="""    function createUnlockCode(){
"""
helpers="""    function armWhatsappReturnDetection(){
      sessionStorage.setItem(ACCESS_WHATSAPP_PENDING_KEY,'1');
      sessionStorage.removeItem(ACCESS_WHATSAPP_LEFT_KEY);
      sessionStorage.setItem(ACCESS_WHATSAPP_LAUNCH_AT_KEY,String(Date.now()));
    }

    function markWhatsappPageLeft(){
      if(sessionStorage.getItem(ACCESS_WHATSAPP_PENDING_KEY)==='1'){
        sessionStorage.setItem(ACCESS_WHATSAPP_LEFT_KEY,'1');
      }
    }

    function completeWhatsappReturnIfNeeded(){
      if(state.registered || !state.awaitingWhatsapp || !state.whatsappOpened || state.whatsappReturned) return false;
      if(sessionStorage.getItem(ACCESS_WHATSAPP_PENDING_KEY)!=='1') return false;
      if(sessionStorage.getItem(ACCESS_WHATSAPP_LEFT_KEY)!=='1') return false;
      const launchedAt=Number(sessionStorage.getItem(ACCESS_WHATSAPP_LAUNCH_AT_KEY)||0);
      const elapsed=Date.now()-launchedAt;
      if(launchedAt && elapsed<700){
        setTimeout(completeWhatsappReturnIfNeeded,700-elapsed+80);
        return false;
      }
      state.whatsappReturned=true;
      sessionStorage.removeItem(ACCESS_WHATSAPP_PENDING_KEY);
      sessionStorage.removeItem(ACCESS_WHATSAPP_LEFT_KEY);
      sessionStorage.removeItem(ACCESS_WHATSAPP_LAUNCH_AT_KEY);
      saveState();
      renderAccessGate();
      if(platformAccessRequired()) openModal('accessModal');
      toast('Agora digite o código enviado pelo Prof. Lucas MPC.');
      return true;
    }

"""
rep(anchor,helpers+anchor,'helpers retorno')

# No clique: prepara código, abre WhatsApp e MANTÉM a tela de solicitação.
old="""          state.registered=false;
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
"""
new="""          state.registered=false;
          state.awaitingWhatsapp=true;
          state.whatsappOpened=true;
          state.whatsappReturned=false;
          state.registration={
            leadId,
            unlockCodeHash,
            name,
            createdAt,
            whatsappRequestedAt:createdAt,
            netlifyCapturedAt:new Date().toISOString()
          };
          armWhatsappReturnDetection();
          saveState();
          const msg=accessWhatsappMessage();
          status.className='registration-submit-status success';
          status.textContent='WhatsApp aberto. Envie a mensagem ao Prof. Lucas MPC. Quando retornar a esta página, aparecerá o campo para inserir seu código.';
          window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
          toast('Envie a mensagem no WhatsApp e depois volte a esta página.');
"""
rep(old,new,'clique whatsapp sem trocar tela')

# Ao validar o código, limpa também os marcadores de retorno.
rep(
"        state.registered=true;\n        state.awaitingWhatsapp=false;\n        state.whatsappOpened=false;\n        state.registration.unlockedAt=new Date().toISOString();",
"        state.registered=true;\n        state.awaitingWhatsapp=false;\n        state.whatsappOpened=false;\n        state.whatsappReturned=false;\n        sessionStorage.removeItem(ACCESS_WHATSAPP_PENDING_KEY);\n        sessionStorage.removeItem(ACCESS_WHATSAPP_LEFT_KEY);\n        sessionStorage.removeItem(ACCESS_WHATSAPP_LAUNCH_AT_KEY);\n        state.registration.unlockedAt=new Date().toISOString();",
'limpar retorno ao liberar'
)

# Detecta saída e retorno reais. O campo de código não aparece no clique.
anchor="""      document.addEventListener('visibilitychange',()=>{
        if(!document.hidden && shareRewardPending && shareAttempted){
"""
new_anchor="""      window.addEventListener('blur',markWhatsappPageLeft);
      window.addEventListener('focus',()=>setTimeout(completeWhatsappReturnIfNeeded,120));
      document.addEventListener('visibilitychange',()=>{
        if(document.hidden){
          markWhatsappPageLeft();
        }else{
          setTimeout(completeWhatsappReturnIfNeeded,120);
        }
        if(!document.hidden && shareRewardPending && shareAttempted){
"""
rep(anchor,new_anchor,'eventos retorno whatsapp')

# Se o navegador recarregar ao voltar do aplicativo, tenta concluir o retorno após inicializar.
old="""      if(platformAccessRequired()){
        setTimeout(enforceAccessGate,120);
      }else if(!sessionStorage.getItem(TUTORIAL_SESSION_KEY)){
"""
new="""      if(platformAccessRequired()){
        setTimeout(()=>{
          if(!completeWhatsappReturnIfNeeded()) enforceAccessGate();
        },120);
      }else if(!sessionStorage.getItem(TUTORIAL_SESSION_KEY)){
"""
rep(old,new,'initialize retorno')

# Reset preserva o acesso, mas não uma viagem pendente ao WhatsApp.
rep(
"        awaitingWhatsapp:false,\n        whatsappOpened:false,\n        registration:state.registration ? {...state.registration} : null,",
"        awaitingWhatsapp:false,\n        whatsappOpened:false,\n        whatsappReturned:false,\n        registration:state.registration ? {...state.registration} : null,",
'reset whatsappReturned'
)

p.write_text(s,encoding='utf-8')
print('PATCH_RETORNO_WHATSAPP_V17_OK')
