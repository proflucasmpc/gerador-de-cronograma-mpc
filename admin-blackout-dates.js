(()=>{
  'use strict';
  const STATE_KEY='geradorCronogramaMpcData';
  const ROUTINE_KEY='mpcAdminStudyRoutineV1';
  const BLACKOUT_KEY='mpcAdminBlackoutRangesV1';
  const $=(s,r=document)=>r.querySelector(s);
  const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
  const parse=v=>{const d=new Date(`${String(v||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const brDate=v=>{const d=parse(v);return d?d.toLocaleDateString('pt-BR'):'—'};

  function normalizeRanges(source){
    const out=[];
    (Array.isArray(source)?source:[]).forEach((r,index)=>{
      let start=String(r?.start||r?.date||'').slice(0,10),end=String(r?.end||r?.start||r?.date||'').slice(0,10);
      const a=parse(start),b=parse(end);if(!a||!b)return;
      if(a>b){const tmp=start;start=end;end=tmp}
      out.push({id:String(r?.id||`blackout-${Date.now()}-${index}`),start,end,reason:String(r?.reason||r?.label||'Indisponibilidade').trim().slice(0,120)||'Indisponibilidade'});
    });
    return out.sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
  }
  function rangesFromState(){
    const local=normalizeRanges(read(BLACKOUT_KEY,[]));if(local.length)return local;
    const state=read(STATE_KEY,{})||{};
    return normalizeRanges(state?.studyRoutine?.blackoutRanges||state?.adminPersonalization?.blackoutRanges||[]);
  }
  function syncMirrors(ranges=rangesFromState(),notify=false){
    ranges=normalizeRanges(ranges);write(BLACKOUT_KEY,ranges);
    const state=read(STATE_KEY,{})||{};
    state.studyRoutine={...(state.studyRoutine||{}),blackoutRanges:ranges};
    state.adminPersonalization={...(state.adminPersonalization||{}),blackoutRanges:ranges};
    write(STATE_KEY,state);
    const routine=read(ROUTINE_KEY,state.studyRoutine||{})||{};
    write(ROUTINE_KEY,{...routine,blackoutRanges:ranges});
    if(notify)document.dispatchEvent(new CustomEvent('mpc:blackout-changed',{detail:{ranges}}));
    return ranges;
  }
  function dateSet(source=rangesFromState()){
    const set=new Set();
    normalizeRanges(source).forEach(r=>{const a=parse(r.start),b=parse(r.end);for(let d=new Date(a);d<=b;d=addDays(d,1))set.add(key(d))});
    return set;
  }
  window.mpcGetBlackoutRanges=()=>normalizeRanges(rangesFromState());
  window.mpcGetBlackoutDateSet=()=>dateSet();
  window.mpcIsBlackoutDate=value=>dateSet().has(String(value||'').slice(0,10));
  window.mpcSyncBlackoutRanges=()=>syncMirrors(rangesFromState(),false);

  function renderList(){
    const list=$('#mpcBlackoutList');if(!list)return;
    const ranges=rangesFromState();
    if(!ranges.length){list.innerHTML='<div style="padding:10px 12px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;font-size:.86rem">Nenhuma indisponibilidade cadastrada. Todos os dias selecionados na rotina continuam disponíveis.</div>';return}
    list.innerHTML=ranges.map(r=>`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #dbe3ef;border-radius:10px;background:#fff"><div><strong>${r.start===r.end?brDate(r.start):`${brDate(r.start)} a ${brDate(r.end)}`}</strong><div style="font-size:.8rem;color:#64748b;margin-top:2px">${esc(r.reason)}</div></div><button type="button" data-remove-blackout="${esc(r.id)}" style="border:1px solid #d1d9e6;border-radius:9px;background:#fff;padding:7px 10px;font-weight:800;cursor:pointer">Excluir</button></div>`).join('');
    list.querySelectorAll('[data-remove-blackout]').forEach(btn=>btn.addEventListener('click',()=>{const next=ranges.filter(r=>r.id!==btn.dataset.removeBlackout);syncMirrors(next,true);renderList()}));
  }
  function findAnchor(){
    const heading=[...document.querySelectorAll('#adminPanel h1,#adminPanel h2,#adminPanel h3,#adminPanel h4')].find(el=>/Resumo inteligente/i.test(el.textContent||''));
    if(heading)return heading.closest('section,.admin-section,.admin-card,.card')||heading.parentElement;
    const preview=$('#adminCapacityPreview');if(preview)return preview.closest('section,.admin-section,.admin-card,.card')||preview.parentElement;
    const generate=$('#adminGenerateScheduleBtn');return generate?.closest('section,.admin-section,.admin-card,.card')||generate?.parentElement||null;
  }
  function mount(){
    if($('#mpcBlackoutSection')){renderList();return}
    const panel=$('#adminPanel'),anchor=findAnchor();if(!panel||!anchor)return;
    const section=document.createElement('section');section.id='mpcBlackoutSection';
    section.style.cssText='margin:0 0 18px;padding:20px 22px;border:1px solid #dbe3ef;border-radius:18px;background:#fff;box-shadow:0 4px 18px rgba(15,23,42,.04)';
    section.innerHTML=`<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><h3 style="margin:0 0 6px;font-size:1.05rem">Datas sem estudo / indisponibilidades</h3><p style="margin:0;color:#64748b;font-size:.88rem;line-height:1.5">Cadastre um dia isolado ou um intervalo. Nessas datas o planejador não agenda teoria, exercícios, revisões, consolidação nem simulados.</p></div></div><div style="display:grid;grid-template-columns:minmax(145px,1fr) minmax(145px,1fr) minmax(180px,1.4fr) auto;gap:10px;margin-top:16px;align-items:end"><label style="font-size:.8rem;font-weight:800;color:#334155">De<input id="mpcBlackoutStart" type="date" style="display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px"></label><label style="font-size:.8rem;font-weight:800;color:#334155">Até<input id="mpcBlackoutEnd" type="date" style="display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px"></label><label style="font-size:.8rem;font-weight:800;color:#334155">Motivo<input id="mpcBlackoutReason" type="text" maxlength="120" placeholder="Ex.: Viagem" style="display:block;width:100%;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px"></label><button id="mpcAddBlackout" type="button" style="border:0;border-radius:10px;background:#0D1B33;color:#fff;padding:11px 15px;font-weight:900;cursor:pointer">Adicionar</button></div><div id="mpcBlackoutList" style="display:grid;gap:8px;margin-top:14px"></div>`;
    anchor.parentNode.insertBefore(section,anchor);
    const start=$('#mpcBlackoutStart'),end=$('#mpcBlackoutEnd');
    start?.addEventListener('change',()=>{if(start.value&&!end.value)end.value=start.value});
    $('#mpcAddBlackout')?.addEventListener('click',()=>{
      const a=start?.value||'',b=end?.value||a,reason=$('#mpcBlackoutReason')?.value.trim()||'Indisponibilidade';
      if(!parse(a)||!parse(b)){alert('Informe a data inicial e a data final da indisponibilidade.');return}
      const ranges=rangesFromState();ranges.push({id:`blackout-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,start:a,end:b,reason});
      syncMirrors(ranges,true);if(start)start.value='';if(end)end.value='';const reasonInput=$('#mpcBlackoutReason');if(reasonInput)reasonInput.value='';renderList();
    });
    renderList();
  }
  function bind(){
    syncMirrors(rangesFromState(),false);mount();setTimeout(mount,250);setTimeout(mount,900);
    document.addEventListener('click',event=>{if(event.target?.closest?.('#adminGenerateScheduleBtn,#publicPageBtn,#exportPublicPageBtn,[data-update-plan]'))syncMirrors(rangesFromState(),false)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();