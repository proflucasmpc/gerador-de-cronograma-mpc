(()=>{
  'use strict';
  const DRAFT_KEY='geradorCronogramaMpcAdminDraft';
  const STATE_KEY='geradorCronogramaMpcData';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(k,f={})=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const PALETTES=['azul-premium','rose-premium','violeta-elegante','verde-executivo','neutro-minimalista'];
  const ALIASES={masculino:'azul-premium',feminino:'rose-premium',aulacerta:'verde-executivo'};
  const valid=value=>{const v=ALIASES[String(value||'')]||String(value||'');return PALETTES.includes(v)?v:'azul-premium'};
  function current(){const draft=read(DRAFT_KEY,{}),state=read(STATE_KEY,{});return valid(draft.publicTheme||state.publicTheme||state.adminPersonalization?.publicTheme||'azul-premium')}
  function save(theme){theme=valid(theme);const draft=read(DRAFT_KEY,{}),state=read(STATE_KEY,{});draft.publicTheme=theme;state.publicTheme=theme;state.adminPersonalization={...(state.adminPersonalization||{}),publicTheme:theme};write(DRAFT_KEY,draft);write(STATE_KEY,state);sync(theme);return theme}
  function sync(theme=current()){document.querySelectorAll('[data-mpc-public-theme]').forEach(card=>{const active=card.dataset.mpcPublicTheme===theme;card.classList.toggle('is-selected',active);card.setAttribute('aria-pressed',String(active))})}
  function styles(){if($('#mpcPublicThemeStyles'))return;const s=document.createElement('style');s.id='mpcPublicThemeStyles';s.textContent=`
    .mpc-public-theme-manager{margin:18px 0;padding:20px;border:1px solid #dbe3ef;border-radius:16px;background:#fff}.mpc-public-theme-manager h4{margin:0 0 5px;color:#0D1B33}.mpc-public-theme-manager p{margin:0;color:#64748b;font-size:.84rem;line-height:1.45}.mpc-public-theme-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.mpc-public-theme-card{border:2px solid #e1e7ef;background:#fff;border-radius:14px;padding:12px;text-align:left;cursor:pointer;transition:.18s ease}.mpc-public-theme-card:hover{transform:translateY(-1px);border-color:#c6d2e1}.mpc-public-theme-card.is-selected{border-color:#315EFB;box-shadow:0 0 0 3px rgba(49,94,251,.10)}.mpc-public-theme-card strong{display:block;margin-bottom:8px}.mpc-theme-swatches{display:flex;gap:5px}.mpc-theme-swatches i{display:block;width:28px;height:28px;border-radius:8px;border:1px solid rgba(0,0,0,.08)}.mpc-theme-note{display:block;margin-top:8px;font-size:.72rem;color:#64748b;line-height:1.35}.mpc-publish-status{margin-left:8px;font-size:.78rem;font-weight:800;color:#315EFB}@media(max-width:1180px){.mpc-public-theme-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.mpc-public-theme-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.mpc-public-theme-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s)}
  function anchor(){return $('#mpcPublicButtonsManager')||$('#adminPdfButtonEnabled')?.closest('.admin-card')||[...document.querySelectorAll('.admin-card')].find(x=>/pdf/i.test(x.textContent||''))||$('#adminCapacityPreview')?.closest('.admin-card')}
  const card=(id,name,colors,note)=>`<button type="button" class="mpc-public-theme-card" data-mpc-public-theme="${id}"><strong>${name}</strong><span class="mpc-theme-swatches">${colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span class="mpc-theme-note">${note}</span></button>`;
  function mount(){if($('#mpcPublicThemeManager')){sync();return true}const a=anchor();if(!a)return false;styles();const box=document.createElement('section');box.id='mpcPublicThemeManager';box.className='mpc-public-theme-manager';box.innerHTML=`<h4>Paleta visual da página</h4><p>Escolha a identidade de cores da página online do aluno. A paleta é independente do gênero e não altera o cronograma, as atividades ou a lógica do planejador.</p><div class="mpc-public-theme-grid">${card('azul-premium','Azul Premium',['#0B1628','#4AA8D8','#C9A46A'],'Azul-marinho, azul sofisticado e dourado.')}${card('rose-premium','Rosé Premium',['#0B1628','#C9879F','#C9A46A'],'Azul-marinho, rosé e dourado suave.')}${card('violeta-elegante','Violeta Elegante',['#241934','#B298D8','#C8AB72'],'Violeta profundo, lilás e dourado.')}${card('verde-executivo','Verde Executivo',['#0A1E28','#138A69','#C5A56C'],'Azul-petróleo, esmeralda e dourado.')}${card('neutro-minimalista','Neutro Minimalista',['#1D2939','#667085','#FFFFFF'],'Branco, cinza e azul-escuro.')}</div>`;a.insertAdjacentElement('afterend',box);box.querySelectorAll('[data-mpc-public-theme]').forEach(btn=>btn.addEventListener('click',()=>save(btn.dataset.mpcPublicTheme)));sync();return true}
  function wrapFetch(){const original=window.fetch;if(!original||original.__mpcPublicThemeWrapped)return;async function wrapped(...args){const input=args[0],url=typeof input==='string'?input:(input?.url||''),opts=args[1]||{},method=(opts.method||input?.method||'GET').toUpperCase();if(['POST','PUT','PATCH'].includes(method)&&/\/api\/plans(?:\?|$)/.test(url)&&typeof opts.body==='string'){try{const data=JSON.parse(opts.body);data.publicTheme=current();args[1]={...opts,body:JSON.stringify(data)}}catch{}}return original.apply(this,args)}wrapped.__mpcPublicThemeWrapped=true;window.fetch=wrapped}
  function setPublishStatus(message,isError=false){let s=$('#mpcPublishStatus');const btn=$('#publicPageBtn');if(!btn)return;if(!s){s=document.createElement('span');s.id='mpcPublishStatus';s.className='mpc-publish-status';btn.insertAdjacentElement('afterend',s)}s.textContent=message||'';s.style.color=isError?'#b42318':'#315EFB'}
  async function publishFallback(){
    const btn=$('#publicPageBtn');if(!btn||btn.dataset.mpcPublishing==='1')return;
    const state=read(STATE_KEY,{}),personalization=state.adminPersonalization||{};
    if(!Array.isArray(state.tasks)||!state.tasks.length){setPublishStatus('Não há atividades para publicar.',true);return}
    const payload={
      studentName:state.studentName||personalization.studentName||'',
      goal:state.goal||'',
      examDate:personalization.examDate||state.examDate||'',
      startDate:personalization.startDate||state.startDate||state.tasks[0]?.date||'',
      endDate:personalization.endDate||state.endDate||state.tasks.at(-1)?.date||'',
      hoursPerDay:state.hoursPerDay||0,
      scheduleStyle:state.scheduleStyle||'weekly',
      subjects:state.subjects||[],
      tasks:state.tasks||[],
      syllabus:state.syllabus||state.adminSyllabus||[],
      generalGuidance:personalization.generalGuidance||state.generalGuidance||'',
      publicTheme:current()
    };
    if(!payload.studentName){setPublishStatus('Informe o nome do aluno antes de publicar.',true);return}
    btn.dataset.mpcPublishing='1';const old=btn.textContent;btn.disabled=true;btn.textContent='Publicando…';setPublishStatus('');
    try{
      const response=await fetch('/api/plans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Não foi possível publicar o cronograma.');
      const url=new URL(result.path||`/plano/${result.id||''}`,location.origin).href;
      try{await navigator.clipboard.writeText(url)}catch{}
      setPublishStatus('Página criada. Link copiado!');
      const w=window.open(url,'_blank','noopener');if(!w)window.prompt('Página criada. Copie o link abaixo:',url);
      setTimeout(()=>location.reload(),900);
    }catch(error){console.error('MPC publish fallback:',error);setPublishStatus(error.message||'Erro ao criar a página.',true)}
    finally{btn.dataset.mpcPublishing='';btn.disabled=false;btn.textContent=old}
  }
  function bindPublishFallback(){const btn=$('#publicPageBtn');if(!btn||btn.dataset.mpcFallbackBound==='1')return false;btn.dataset.mpcFallbackBound='1';btn.addEventListener('click',e=>{setTimeout(()=>{if(btn.disabled||btn.textContent==='Publicando…')return;publishFallback()},80)});return true}
  function init(){wrapFetch();let tries=0;const timer=setInterval(()=>{const a=mount(),b=bindPublishFallback();if((a&&b)||++tries>60)clearInterval(timer)},100);document.addEventListener('click',e=>{if(e.target?.closest?.('#publicPageBtn,#exportPublicPageBtn,[data-update-plan],[data-update-current]'))save(current())},true)}
  window.mpcGetPublicTheme=current;window.mpcSetPublicTheme=save;window.mpcPublishPlanFallback=publishFallback;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();