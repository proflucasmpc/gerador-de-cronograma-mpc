import { getStore } from '@netlify/blobs';

const PLAN_STORE='mpc-public-plans';
const BUTTON_STORE='mpc-public-plan-buttons';
const ID_RE=/^[A-Z0-9]{10}$/;

const clean=(value,max=500)=>String(value??'').replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,max);
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function hash(value){const bytes=new TextEncoder().encode(String(value||''));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function cleanButtons(input){return (Array.isArray(input)?input:[]).slice(0,8).map(button=>{const raw=clean(button?.url,1000);return{text:clean(button?.text,80),url:/^(https?:\/\/|mailto:|tel:)/i.test(raw)?raw:'',style:['primary','navy','gold','green','outline'].includes(button?.style)?button.style:'primary',enabled:button?.enabled!==false}}).filter(button=>button.text&&button.url)}

export default async req=>{
  const url=new URL(req.url);const id=clean(url.searchParams.get('id'),20).toUpperCase();
  if(!ID_RE.test(id))return json({error:'Link de cronograma inválido.'},400);
  const buttons=getStore({name:BUTTON_STORE,consistency:'strong'});
  if(req.method==='GET')return json({id,buttons:(await buttons.get(id,{type:'json',consistency:'strong'}))||[]});
  if(req.method!=='PUT')return json({error:'Método não permitido.'},405);
  const plans=getStore({name:PLAN_STORE,consistency:'strong'});const plan=await plans.get(id,{type:'json',consistency:'strong'});
  if(!plan)return json({error:'Cronograma não encontrado.'},404);
  const key=clean(req.headers.get('x-plan-key'),120);if(!key)return json({error:'Chave de gerenciamento ausente.'},401);
  if(!plan._manageHash||await hash(key)!==plan._manageHash)return json({error:'Chave de gerenciamento inválida.'},403);
  let body={};try{body=await req.json()}catch{return json({error:'Dados inválidos.'},400)}
  const data=cleanButtons(body.buttons);await buttons.setJSON(id,data,{metadata:{updatedAt:new Date().toISOString()}});return json({id,count:data.length});
};

export const config={path:'/api/plan-buttons'};
