(()=>{
  'use strict';
  async function run(){
    const parts=location.pathname.split('/').filter(Boolean);
    const id=(parts.at(-1)||'').toUpperCase();
    if(!/^[A-Z0-9]{10}$/.test(id)) return;
    let plan;try{const r=await fetch(`/api/plans?id=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)return;plan=await r.json()}catch{return}
    if(!plan?.createdByUser) return;
    const hero=document.querySelector('.hero');if(!hero)return;
    const wrap=document.createElement('section');wrap.className='creator-share-banner';
    const style=document.createElement('style');style.textContent=`.creator-share-banner{max-width:1180px;margin:0 auto 26px;padding:0 24px}.creator-share-card{background:#fff;border:1px solid #E4E8F0;border-left:6px solid #8A5CFF;border-radius:14px;padding:20px 22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}.creator-share-card strong{display:block;color:#071225;font-family:Georgia,serif;font-size:21px;line-height:1.2}.creator-share-card p{margin:7px 0 0;color:#657086;font-size:14px}.creator-share-btn{background:#8A5CFF;color:#fff!important;border-radius:10px;padding:12px 15px;font-size:12px;font-weight:900;white-space:nowrap;text-decoration:none}@media(max-width:700px){.creator-share-banner{padding:0 14px}.creator-share-card{grid-template-columns:1fr}.creator-share-btn{text-align:center}}`;document.head.appendChild(style);
    const card=document.createElement('div');card.className='creator-share-card';
    const copy=document.createElement('div');const strong=document.createElement('strong');strong.textContent=`Eu, ${plan.creatorName||plan.studentName||'estudante'}, gerei este cronograma de estudos gratuitamente com o Gerador de Cronograma MPC.`;const p=document.createElement('p');p.textContent='Quer organizar seus estudos assim também? Gere gratuitamente seu próprio cronograma com matérias, tópicos, subtópicos e uma página pronta para acompanhar no celular.';copy.append(strong,p);
    const a=document.createElement('a');a.className='creator-share-btn';a.href='/';a.textContent='CRIAR MEU CRONOGRAMA GRATUITAMENTE';card.append(copy,a);wrap.appendChild(card);hero.insertAdjacentElement('afterend',wrap);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
