(()=>{
  'use strict';
  const STORAGE_KEY='mpcAdminPublicPageButtonsV1';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const MAX_BUTTONS=8;
  const $=(s,r=document)=>r.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cleanStyle=v=>['primary','navy','gold','green','outline'].includes(v)?v:'primary';
  const normalizeUrl=value=>{
    const raw=String(value||'').trim();
    if(!raw)return'';
    if(/^https?:\/\//i.test(raw))return raw;
    if(/^mailto:|^tel:/i.test(raw))return raw;
    return `https://${raw}`;
  };
  function read(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return Array.isArray(v)?v.slice(0,MAX_BUTTONS):[]}catch{return[]}}
  function save(items){
    const clean=(items||[]).slice(0,MAX_BUTTONS).map((item,index)=>({
      id:String(item.id||`link-${Date.now()}-${index}`),
      text:String(item.text||'').trim().slice(0,80),
      url:normalizeUrl(item.url).slice(0,1000),
      style:cleanStyle(item.style),
      enabled:item.enabled!==false
    })).filter(item=>item.text||item.url);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(clean))}catch{}
    syncSnapshots(clean);
    return clean;
  }
  function syncSnapshots(items){
    try{
      const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(draft&&typeof draft==='object'){draft.publicPageButtons=items;localStorage.setItem(DRAFT_KEY,JSON.stringify(draft))}
    }catch{}
    try{
      const state=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(state&&typeof state==='object'){state.publicPageButtons=items;localStorage.setItem(STATE_KEY,JSON.stringify(state))}
    }catch{}
  }
  function restoreFromSnapshots(){
    if(read().length)return;
    let candidates=[];
    try{candidates=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null')?.publicPageButtons||[]}catch{}
    if(!Array.isArray(candidates)||!candidates.length){try{candidates=JSON.parse(localStorage.getItem(STATE_KEY)||'null')?.publicPageButtons||[]}catch{}}
    if(Array.isArray(candidates)&&candidates.length)save(candidates);
  }
  function findAnchor(){
    const pdfToggle=$('#adminPdfButtonEnabled');
    const card=pdfToggle?.closest('.admin-card');
    if(card)return card;
    const pdfSection=$('[data-admin-section="pdf"],#adminPdfSection');
    if(pdfSection)return pdfSection;
    const cards=[...document.querySelectorAll('.admin-card')];
    return cards.find(card=>/personaliza[cç][aã]o do pdf|pdf/i.test(card.textContent||''))||cards.at(-1)||null;
  }
  function manager(){
    let box=$('#mpcPublicButtonsManager');
    if(box)return box;
    const anchor=findAnchor();if(!anchor)return null;
    box=document.createElement('section');
    box.id='mpcPublicButtonsManager';box.className='mpc-public-buttons-manager';
    box.innerHTML=`<div class="mpc-public-buttons-manager-head"><div><h4>Botões da página do aluno</h4><p>Adicione links úteis diretamente à página publicada do aluno. Você pode criar até ${MAX_BUTTONS} botões e escolher um estilo para cada um.</p></div><div class="mpc-public-buttons-actions"><button type="button" id="mpcImportPdfButton">Importar botão do PDF</button><button type="button" class="primary" id="mpcAddPublicButton">+ Adicionar botão</button></div></div><div id="mpcPublicButtonsList" class="mpc-public-buttons-list"></div><div class="mpc-public-buttons-note">Os botões são salvos junto com a página publicada. Alterar o rascunho não modifica uma página já publicada até você usar “Atualizar página”.</div>`;
    anchor.insertAdjacentElement('afterend',box);
    $('#mpcAddPublicButton',box)?.addEventListener('click',()=>{
      const items=read();if(items.length>=MAX_BUTTONS)return alert(`É possível adicionar até ${MAX_BUTTONS} botões por página.`);
      items.push({id:`link-${Date.now()}`,text:'',url:'',style:'primary',enabled:true});save(items);render();
    });
    $('#mpcImportPdfButton',box)?.addEventListener('click',()=>{
      const text=String($('#adminPdfButtonText')?.value||'').trim();
      const url=String($('#adminPdfButtonUrl')?.value||'').trim();
      if(!text||!url)return alert('Preencha primeiro o texto e o link do botão do PDF.');
      const items=read();if(items.length>=MAX_BUTTONS)return alert(`É possível adicionar até ${MAX_BUTTONS} botões por página.`);
      if(items.some(x=>x.text===text&&normalizeUrl(x.url)===normalizeUrl(url)))return alert('Este botão já está na lista da página do aluno.');
      items.push({id:`link-${Date.now()}`,text,url,style:'primary',enabled:true});save(items);render();
    });
    return box;
  }
  function render(){
    const box=manager();if(!box)return;
    const list=$('#mpcPublicButtonsList',box);const items=read();
    if(!items.length){list.innerHTML='<div class="mpc-public-buttons-empty">Nenhum botão adicional configurado para a página do aluno.</div>';return}
    list.innerHTML=items.map((item,index)=>`<div class="mpc-public-button-row" data-index="${index}"><label>Texto<input type="text" data-field="text" maxlength="80" value="${esc(item.text)}" placeholder="Ex.: Acesse todos os materiais"></label><label>Link<input type="url" data-field="url" value="${esc(item.url)}" placeholder="https://..."></label><label>Estilo<select data-field="style"><option value="primary" ${item.style==='primary'?'selected':''}>Azul destaque</option><option value="navy" ${item.style==='navy'?'selected':''}>Azul-marinho</option><option value="gold" ${item.style==='gold'?'selected':''}>Dourado</option><option value="green" ${item.style==='green'?'selected':''}>Verde</option><option value="outline" ${item.style==='outline'?'selected':''}>Contorno</option></select></label><button type="button" class="remove" data-remove="${index}">Remover</button></div>`).join('');
    list.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{
      const row=el.closest('[data-index]');const i=Number(row?.dataset.index);const arr=read();if(!arr[i])return;arr[i][el.dataset.field]=el.value;save(arr);
    }));
    list.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>{const arr=read();arr.splice(Number(btn.dataset.remove),1);save(arr);render()}));
  }
  function installFetchInjection(){
    const original=window.fetch;if(!original||original.__mpcPublicButtonsWrapped)return;
    async function wrapped(input,opts={}){
      const url=typeof input==='string'?input:(input?.url||'');const method=(opts.method||input?.method||'GET').toUpperCase();
      if(/\/api\/plans(?:\?|$)/.test(url)&&(method==='POST'||method==='PUT')&&typeof opts.body==='string'){
        try{const data=JSON.parse(opts.body);data.publicPageButtons=save(read());opts={...opts,body:JSON.stringify(data)}}catch{}
      }
      return original.call(this,input,opts);
    }
    wrapped.__mpcPublicButtonsWrapped=true;window.fetch=wrapped;
  }
  function init(){restoreFromSnapshots();manager();render();installFetchInjection();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
