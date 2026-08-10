from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
original = text

def sub(pattern, repl, label, count=1, flags=re.S):
    global text
    text2, n = re.subn(pattern, repl, text, count=count, flags=flags)
    if n != count:
        raise SystemExit(f'{label}: esperava {count}, encontrei {n}')
    text = text2

# Version bump where available.
text = text.replace('const DATA_SCHEMA_VERSION = 11;', 'const DATA_SCHEMA_VERSION = 12;', 1)

# Remove the old registration modal / Netlify form entirely.
sub(r'\n  <!-- Cadastro obrigatório -->.*?(?=\n  <!-- Liberação obrigatória pelo WhatsApp -->)', '\n', 'registerModal')

# Replace old two-step WhatsApp/code modal with one manual-code gate.
new_modal = r'''
  <!-- Liberação de acesso por código manual -->
  <div class="modal-backdrop required-modal" id="accessModal" data-required="true" aria-hidden="true">
    <div class="modal access-modal-shell" role="dialog" aria-modal="true" aria-labelledby="accessTitle">
      <div class="modal-head">
        <h2 id="accessTitle">Liberar acesso ao Gerador MPC</h2>
      </div>
      <div class="access-code-only-view" id="accessCodeView">
        <div class="access-icon" aria-hidden="true">🔐</div>
        <div class="notice">
          <strong>Digite o código de 6 caracteres enviado pelo Prof. Lucas MPC.</strong><br>
          O código pode conter letras e números.
        </div>
        <div class="field access-code-field">
          <label for="accessCodeInput">Código de acesso</label>
          <input id="accessCodeInput" type="text" inputmode="text" autocomplete="one-time-code" maxlength="6" pattern="[A-Za-z0-9]{6}" aria-describedby="accessCodeStatus" placeholder="A1B2C3">
        </div>
        <button class="btn btn-primary access-release-button" id="accessCodeBtn" type="button">Liberar acesso</button>
        <button class="btn btn-secondary access-release-button" id="accessWhatsappBtn" type="button">Solicitar código pelo WhatsApp</button>
        <p class="registration-submit-status" id="accessCodeStatus" role="status" aria-live="polite"></p>
      </div>
    </div>
  </div>
'''
sub(r'\n  <!-- Liberação obrigatória pelo WhatsApp -->.*?(?=\n  <script>\n  \(\(\) => \{)', '\n'+new_modal.rstrip(), 'accessModal')

# Remove temporary return-to-WhatsApp constants.
text = re.sub(r'\n    const ACCESS_WHATSAPP_PENDING_KEY = .*?;\n    const ACCESS_WHATSAPP_LEFT_KEY = .*?;\n    const ACCESS_WHATSAPP_LAUNCH_AT_KEY = .*?;', '', text, count=1)

# Replace all access helper functions up to privacy rendering.
new_access_helpers = r'''    function renderAccessGate(){
      const input=el('accessCodeInput');
      const status=el('accessCodeStatus');
      if(status){
        status.textContent='';
        status.className='registration-submit-status';
      }
      if(input) input.value='';
      setTimeout(()=>input?.focus(),120);
    }

    function accessWhatsappMessage(){
      return 'Olá, professor Lucas MPC. Gostaria de receber um código de acesso de 6 caracteres para usar gratuitamente o Gerador de Cronograma MPC.';
    }

'''
sub(r'    function renderAccessGate\(\)\{.*?(?=    function renderPrivacyConsent\(\)\{)', new_access_helpers, 'access helpers')

# Replace old registration + WhatsApp preparation handlers with only the WhatsApp request button.
new_whatsapp = r'''      el('accessWhatsappBtn').onclick=()=>{
        const msg=accessWhatsappMessage();
        window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
        toast('Envie a mensagem ao Prof. Lucas MPC e aguarde seu código.');
      };
'''
sub(r"      el\('registerForm'\)\.onsubmit=async e=>\{.*?(?=      el\('adminPinInput'\)\.addEventListener)", new_whatsapp, 'register handlers')

# Replace numeric/hash validation with any six alphanumeric characters.
new_code = r'''      el('accessCodeInput').addEventListener('input',event=>{
        event.target.value=event.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      });
      el('accessCodeInput').addEventListener('keydown',event=>{
        if(event.key==='Enter') el('accessCodeBtn').click();
      });
      el('accessCodeBtn').onclick=()=>{
        const input=el('accessCodeInput');
        const status=el('accessCodeStatus');
        const code=String(input.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
        if(!/^[A-Z0-9]{6}$/.test(code)){
          status.className='registration-submit-status error';
          status.textContent='Digite um código com exatamente 6 letras e/ou números.';
          input.focus();
          return;
        }
        state.registered=true;
        state.awaitingWhatsapp=false;
        state.whatsappOpened=false;
        state.whatsappReturned=false;
        state.registration={...(state.registration||{}),accessMode:'manual-code',unlockedAt:new Date().toISOString()};
        saveState();
        closeModal('accessModal',true);
        setAccessLock(false);
        toast('Acesso gratuito liberado neste navegador.');
      };
'''
sub(r"      el\('accessCodeInput'\)\.addEventListener\('input',event=>\{.*?(?=      el\('toolsButton'\)\.onclick)", new_code, 'access validation')

# Remove return-detection listeners while preserving share confirmation logic.
text = text.replace("      window.addEventListener('blur',markWhatsappPageLeft);\n", '')
text = text.replace("      window.addEventListener('focus',()=>setTimeout(completeWhatsappReturnIfNeeded,120));\n", '')
text = re.sub(r"      document\.addEventListener\('visibilitychange',\(\)=>\{\n        if\(document\.hidden\)\{\n          markWhatsappPageLeft\(\);\n        \}else\{\n          setTimeout\(completeWhatsappReturnIfNeeded,120\);\n        \}\n", "      document.addEventListener('visibilitychange',()=>{\n", text, count=1)

# Initialize access directly without WhatsApp-return dependency.
text = text.replace("""      if(platformAccessRequired()){
        setTimeout(()=>{
          if(!completeWhatsappReturnIfNeeded()) enforceAccessGate();
        },120);
      }else if(!sessionStorage.getItem(TUTORIAL_SESSION_KEY)){""", """      if(platformAccessRequired()){
        setTimeout(enforceAccessGate,120);
      }else if(!sessionStorage.getItem(TUTORIAL_SESSION_KEY)){""", 1)

# Remove calls to old registration DOM where they are now optional/nonexistent.
text = text.replace("      el('openPrivacyBtn').onclick=openPrivacyDocument;", "      el('openPrivacyBtn')?.addEventListener('click',openPrivacyDocument);", 1)
text = text.replace("        renderPrivacyConsent();\n        closeModal('privacyModal');\n        setTimeout(()=>el('privacyConsent')?.focus(),50);", "        closeModal('privacyModal');", 1)

# Migrate old pending states safely.
text = re.sub(r"        if\(loaded\.awaitingWhatsapp && !loaded\.registration\?\.unlockCodeHash\)\{.*?        \}", """        if(!loaded.registered){
          loaded.awaitingWhatsapp=false;
          loaded.whatsappOpened=false;
          loaded.whatsappReturned=false;
        }""", text, count=1, flags=re.S)

# Update user-facing claims where exact old copy exists.
text = text.replace('Plataforma desenvolvida pelo <strong>Prof. Lucas MPC</strong> · O cronograma fica salvo neste navegador; os dados do cadastro são enviados para a área privada da plataforma.', 'Plataforma desenvolvida pelo <strong>Prof. Lucas MPC</strong> · O cronograma e a liberação de acesso ficam salvos neste navegador.', 1)
text = text.replace('Ao entrar na plataforma pela primeira vez, o site solicita o nome para preparar um código individual de acesso. O pedido é registrado na área privada do projeto na Netlify antes do direcionamento ao WhatsApp.', 'Ao entrar na plataforma pela primeira vez, o acesso é liberado por um código manual de 6 caracteres fornecido pelo Prof. Lucas MPC. Não há formulário obrigatório para gerar esse código.', 1)
text = text.replace('Depois de cinco ações, o cadastro e o direcionamento ao WhatsApp são apresentados como condição para continuar usando gratuitamente a plataforma.', 'Na primeira entrada, um código manual de 6 caracteres é solicitado para liberar gratuitamente a plataforma.', 1)
text = text.replace('Na primeira entrada, a solicitação do código e o direcionamento ao WhatsApp são apresentados como condição para liberar gratuitamente a plataforma. O cadastro precisa ser recebido pela plataforma antes de o usuário avançar para a etapa do WhatsApp. A continuidade do acesso pode depender do recebimento e da validação de uma senha enviada pelo Prof. Lucas MPC.', 'Na primeira entrada, a plataforma solicita um código manual de 6 caracteres fornecido pelo Prof. Lucas MPC. O código pode conter letras e números e a liberação fica registrada neste navegador.', 1)
text = text.replace('Voltar ao cadastro', 'Fechar documento', 1)
text = text.replace('Seu cadastro, acesso e créditos foram preservados.', 'Seu acesso e créditos foram preservados.')

# Hard safety checks.
for old in ['createUnlockCode', 'hashUnlockCode', 'submitRegistrationToNetlify', 'unlockCodeHash', "el('registerForm')", 'completeWhatsappReturnIfNeeded', 'markWhatsappPageLeft', 'armWhatsappReturnDetection']:
    if old in text:
        raise SystemExit('referência antiga ainda presente: '+old)
for new in ['pattern="[A-Za-z0-9]{6}"', '/^[A-Z0-9]{6}$/.test(code)', "accessMode:'manual-code'", 'Solicitar código pelo WhatsApp']:
    if new not in text:
        raise SystemExit('recurso novo ausente: '+new)
if text == original:
    raise SystemExit('nenhuma alteração aplicada')
path.write_text(text, encoding='utf-8')
print('index.html atualizado')
