(()=>{
  'use strict';
  const PALETTES={
    'azul-premium':{navy:'#0B1628',navy2:'#18324F',navy3:'#07111F',gold:'#C9A46A',cyan:'#4AA8D8',purple:'#6B7FD7',blue:'#4169A1',green:'#2E9A6F',orange:'#D7923D',bg:'#F6F8FB',paper:'#FFFFFF',text:'#1F2A37',muted:'#687386',line:'#E3E8EF',track:'#ECF0F4'},
    'rose-premium':{navy:'#0B1628',navy2:'#26364E',navy3:'#07111F',gold:'#C9A46A',cyan:'#C9879F',purple:'#9F7DBD',blue:'#6D7FB6',green:'#3E9A79',orange:'#D18C58',bg:'#FAF7F9',paper:'#FFFFFF',text:'#29303A',muted:'#756D75',line:'#E9E1E6',track:'#F1EBEF'},
    'violeta-elegante':{navy:'#241934',navy2:'#39274D',navy3:'#181120',gold:'#C8AB72',cyan:'#B298D8',purple:'#8A67B5',blue:'#7D75B7',green:'#4D9D7C',orange:'#C28A55',bg:'#F8F6FA',paper:'#FFFFFF',text:'#2C2732',muted:'#756E7B',line:'#E7E1EA',track:'#EFEAF2'},
    'verde-executivo':{navy:'#0A1E28',navy2:'#123845',navy3:'#07161D',gold:'#C5A56C',cyan:'#2CA58D',purple:'#5D75B8',blue:'#347BA0',green:'#138A69',orange:'#D08B45',bg:'#F5F8F7',paper:'#FFFFFF',text:'#203038',muted:'#66757B',line:'#DFE8E5',track:'#E9F0EE'},
    'neutro-minimalista':{navy:'#1D2939',navy2:'#344054',navy3:'#101828',gold:'#B6925E',cyan:'#667085',purple:'#7F56D9',blue:'#475467',green:'#2E8B57',orange:'#B7791F',bg:'#F8F9FB',paper:'#FFFFFF',text:'#1D2939',muted:'#667085',line:'#EAECF0',track:'#F2F4F7'}
  };
  const ALIASES={masculino:'azul-premium',feminino:'rose-premium',aulacerta:'verde-executivo'};
  const slug=location.pathname.match(/^\/aluno\/([^/?#]+)/i)?.[1]?.toLowerCase().replace(/[^a-z0-9-]/g,'')||'';
  const normalize=v=>{const key=ALIASES[String(v||'')]||String(v||'');return PALETTES[key]?key:'azul-premium'};
  const apply=theme=>{const name=normalize(theme),vars=PALETTES[name];document.documentElement.dataset.studentPalette=name;Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(`--${k}`,v));return name};
  async function load(){if(!slug)return;try{const r=await fetch(`/api/student-plan?student=${encodeURIComponent(slug)}&_palette=${Date.now()}`,{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;const plan=await r.json();apply(plan.publicTheme||plan.adminPersonalization?.publicTheme)}catch{}}
  window.mpcApplyStudentPalette=apply;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();