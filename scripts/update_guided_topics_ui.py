from pathlib import Path
import re

path=Path('guided-user.js')
js=path.read_text('utf-8')

old_render=re.compile(r"function renderTopics\(\)\{return `.*?`\}\nfunction renderSubs",re.S)
new_render="""function renderTopics(){return `<div class=\"topic-editor\">${state.subjects.map((s,si)=>`<div class=\"topic-block\"><h4>${esc(s)}</h4><div class=\"subject-builder\">${(state.topics[s]||[]).map((t,ti)=>`<div class=\"subject-row\"><div class=\"subject-row-head\"><div><strong>${esc(t)}</strong><br><small>Tópico ${ti+1}</small></div><button class=\"btn btn-muted\" type=\"button\" data-remove-topic-subject=\"${si}\" data-remove-topic-index=\"${ti}\">Remover</button></div></div>`).join('')}<div class=\"field\"><label>Adicionar tópico em ${esc(s)}</label><div style=\"display:flex;gap:8px\"><input id=\"newTopic-${si}\" placeholder=\"Ex.: Interpretação de textos\"><button class=\"add-btn\" type=\"button\" data-add-topic=\"${si}\">+ ADICIONAR TÓPICO</button></div><span class=\"hint\">Adicione um tópico por vez, exatamente como aparece no conteúdo programático.</span></div></div></div>`).join('')}</div>`}
function renderSubs"""
js,n=old_render.subn(new_render,js,count=1)
if n!=1: raise SystemExit('renderTopics não encontrado')

old_bind=""" document.querySelectorAll('[data-topic]').forEach(t=>t.oninput=()=>{state.topics[t.dataset.topic]=t.value.split('\\n').map(x=>x.trim()).filter(Boolean);persist()});
 document.querySelectorAll('[data-subject]').forEach(t=>t.oninput=()=>{const s=t.dataset.subject,topic=t.dataset.topicname;state.subs[s] ||= {};state.subs[s][topic]=t.value.split('\\n').map(x=>x.trim()).filter(Boolean);persist()});"""
new_bind=""" document.querySelectorAll('[data-add-topic]').forEach(b=>b.onclick=()=>{const si=Number(b.dataset.addTopic),subject=state.subjects[si],input=el(`newTopic-${si}`);if(!subject||!input)return;const value=input.value.trim();state.topics[subject] ||= [];if(value&&!state.topics[subject].some(x=>x.toLowerCase()===value.toLowerCase())){state.topics[subject].push(value);persist();renderStep()}else if(value){toast('Esse tópico já foi adicionado.')}});
 document.querySelectorAll('[data-remove-topic-subject]').forEach(b=>b.onclick=()=>{const si=Number(b.dataset.removeTopicSubject),ti=Number(b.dataset.removeTopicIndex),subject=state.subjects[si];if(!subject)return;const topic=(state.topics[subject]||[])[ti];if(topic&&state.subs[subject])delete state.subs[subject][topic];(state.topics[subject]||[]).splice(ti,1);persist();renderStep()});
 document.querySelectorAll('[id^=\"newTopic-\"]').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const si=Number(input.id.replace('newTopic-',''));document.querySelector(`[data-add-topic=\"${si}\"]`)?.click()}}));
 document.querySelectorAll('[data-subject]').forEach(t=>t.oninput=()=>{const s=t.dataset.subject,topic=t.dataset.topicname;state.subs[s] ||= {};state.subs[s][topic]=t.value.split('\\n').map(x=>x.trim()).filter(Boolean);persist()});"""
if old_bind not in js: raise SystemExit('bind antigo de tópicos não encontrado')
js=js.replace(old_bind,new_bind,1)

assert 'Digite um tópico por linha' not in js
assert '+ ADICIONAR TÓPICO' in js
assert 'data-remove-topic-subject' in js
assert 'Esse tópico já foi adicionado.' in js
path.write_text(js,'utf-8')
print('Cadastro individual de tópicos aplicado.')
