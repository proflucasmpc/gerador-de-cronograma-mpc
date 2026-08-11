from pathlib import Path

path = Path('admin-enhancements.css')
css = path.read_text(encoding='utf-8')
marker = '/* Autenticação administrativa: identidade limpa desde a entrada */'
if marker in css:
    raise SystemExit('Correção já aplicada.')

extra = r'''

/* Autenticação administrativa: identidade limpa desde a entrada */
#tutorialBtn,
#paletteBtn,
#shareBtn,
#themeBtn,
#adminEntryBtn,
#studentViewBtn,
#adminViewBtn,
#adminPreviewStudentBtn,
#mpcQuickPreview{display:none!important}

.brand span{font-size:0!important;line-height:1.25}
.brand span::after{content:"Painel Administrativo · Prof. Lucas MPC";font-size:.78rem;color:#DCE7F8;font-weight:700;letter-spacing:.01em}

body:not(.admin-view) .header-actions{display:none!important}
body:has(#adminAuthModal[aria-hidden="false"]){background:linear-gradient(160deg,#071225 0%,#0D1B33 48%,#18365E 100%)!important;min-height:100vh}
body:has(#adminAuthModal[aria-hidden="false"]) main.container,
body:has(#adminAuthModal[aria-hidden="false"]) .footer-ad,
body:has(#adminAuthModal[aria-hidden="false"]) .tools-button{display:none!important}
body:has(#adminAuthModal[aria-hidden="false"]) .topbar{background:#071225!important;border-bottom:3px solid var(--admin-cyan)!important;box-shadow:0 8px 28px rgba(0,0,0,.22)!important}
body:has(#adminAuthModal[aria-hidden="false"]) .brand strong,
body:has(#adminAuthModal[aria-hidden="false"]) .brand span{color:#fff!important}

#adminAuthModal.admin-auth-modal{background:rgba(3,11,25,.72)!important;backdrop-filter:blur(8px);padding:24px!important}
#adminAuthModal .modal{width:min(620px,100%)!important;border:1px solid rgba(255,255,255,.16)!important;border-top:6px solid var(--admin-cyan)!important;border-radius:22px!important;background:#fff!important;box-shadow:0 30px 90px rgba(0,0,0,.38)!important;padding:30px!important}
#adminAuthModal .modal-head{margin-bottom:18px!important}
#adminAuthModal .modal-head h2{font-family:Georgia,"Times New Roman",serif!important;font-size:clamp(28px,4vw,38px)!important;line-height:1.08!important;color:var(--admin-navy)!important;margin:0!important}
#adminAuthModal .modal-close{display:none!important}
#adminAuthModal .notice{border:1px solid #C9D8EA!important;border-left:5px solid var(--admin-cyan)!important;border-radius:13px!important;background:#EEF5FC!important;color:#29425E!important;padding:13px 15px!important;margin-bottom:18px!important;line-height:1.5!important}
#adminAuthModal label{color:var(--admin-navy)!important;font-weight:900!important}
#adminAuthModal input{width:100%!important;min-height:52px!important;border:1px solid #D8DFEA!important;border-radius:11px!important;background:#F8FAFD!important;color:var(--admin-text)!important;padding:0 14px!important;font:inherit!important;outline:none!important}
#adminAuthModal input:focus{border-color:var(--admin-cyan)!important;box-shadow:0 0 0 3px rgba(36,200,255,.14)!important;background:#fff!important}
#adminAuthModal input:disabled{opacity:1!important;color:#526174!important;background:#F2F5F9!important}
#adminAuthModal .modal-actions{margin-top:20px!important}
#adminAuthModal #adminAuthSubmitBtn{min-height:52px!important;min-width:150px!important;border:0!important;border-radius:11px!important;background:var(--admin-cyan)!important;color:var(--admin-navy)!important;font-weight:950!important;box-shadow:0 8px 20px rgba(36,200,255,.2)!important}
#adminAuthModal #adminAuthSubmitBtn:hover{filter:brightness(.96);transform:translateY(-1px)}

@media(max-width:700px){
  #adminAuthModal.admin-auth-modal{padding:12px!important;align-items:center!important}
  #adminAuthModal .modal{padding:22px 18px!important;border-radius:17px!important;max-height:calc(100vh - 24px)!important;overflow:auto!important}
  body:has(#adminAuthModal[aria-hidden="false"]) .topbar-inner{align-items:center!important;padding:10px 14px!important}
  body:has(#adminAuthModal[aria-hidden="false"]) .brand{justify-content:flex-start!important}
}
'''
path.write_text(css + extra, encoding='utf-8')
