from pathlib import Path
import re

path=Path('guided-user.js')
js=path.read_text('utf-8')

old_render=re.compile(r"function renderSubs\(\)\{return `.*?`\}\nfunction summaryCounts",re.S)
new_render="""function renderSubs(){return `<div class=\"topic-editor\">${state.subjects.map((s,si)=>{const topics=state.topics[s]||[];return `<div class=\"topic-block\"><h4>${esc(s)}</h4>${topics.length?topics.map((t,ti)=>`<div class=\"subject-builder\" style=\"margin-top:12px\"><div class=\"subject-row\" style=\"border-left:4px solid #8A5CFF\"><div class=\"subject-row-head\"><div><strong>${esc(s)} (${esc(t)})</strong><br><small>Subtópicos deste tópico</small></div></div></div>${(((state.subs[s]||{})[t])||[]).map((sub,subi)=>`<div class=\"subject-row\"><div class=\"subject-row-head\"><div><strong>${esc(sub)}</strong><br><small>Subtópico ${subi+1}</small></div><button class=\"btn btn-muted\" type=\"button\" data-remove-subtopic-subject=\"${si}\" data-remove-subtopic-topic=\"${ti}\" data-remove-subtopic-index=\"${subi}\">Remover</button></div></div>`).join('')}<div class=\"field\"><label>Adicionar subtópico</label><div style=\"display:flex;gap:8px\"><input id=\"newSubtopic-${si}-${ti}\" placeholder=\"Ex.: Compreensão e interpretação\"><button class=\"add-btn\" type=\"button\" data-add-subtopic-subject=\"${si}\" data-add-subtopic-topic=\"${ti}\">+ ADICIONAR SUBTÓPICO</button></div><span class=\"hint\">Adicione um subtópico por vez para manter a estrutura organizada.</span></div></div>`).join(''):`<span class=\"hint\">Cadastre os tópicos desta matéria na etapa anterior.</span>`}</div>`}).join('')}</div>`}
function summaryCounts"""
js,n=old_render.subn(new_render,js,count=1)
if n!=1:
    raise SystemExit('renderSubs não encontrado')

old_bind=re.compile(r" document\.querySelectorAll\('\[data-subject\]'\)\.forEach\(t=>t\.oninput=\(\)=>\{.*?persist\(\)\}\);",re.S)
new_bind=""" document.querySelectorAll('[data-add-subtopic-subject]').forEach(b=>b.onclick=()=>{const si=Number(b.dataset.addSubtopicSubject),ti=Number(b.dataset.addSubtopicTopic),subject=state.subjects[si],topic=(state.topics[subject]||[])[ti],input=el(`newSubtopic-${si}-${ti}`);if(!subject||!topic||!input)return;const value=input.value.trim();state.subs[subject] ||= {};state.subs[subject][topic] ||= [];if(value&&!state.subs[subject][topic].some(x=>x.toLowerCase()===value.toLowerCase())){state.subs[subject][topic].push(value);persist();renderStep()}else if(value){toast('Esse subtópico já foi adicionado.')}});
 document.querySelectorAll('[data-remove-subtopic-subject]').forEach(b=>b.onclick=()=>{const si=Number(b.dataset.removeSubtopicSubject),ti=Number(b.dataset.removeSubtopicTopic),subi=Number(b.dataset.removeSubtopicIndex),subject=state.subjects[si],topic=(state.topics[subject]||[])[ti];if(!subject||!topic)return;const arr=((state.subs[subject]||{})[topic]||[]);arr.splice(subi,1);persist();renderStep()});
 document.querySelectorAll('[id^=\"newSubtopic-\"]').forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const parts=input.id.replace('newSubtopic-','').split('-').map(Number);document.querySelector(`[data-add-subtopic-subject=\"${parts[0]}\"][data-add-subtopic-topic=\"${parts[1]}\"]`)?.click()}}));"""
js,n=old_bind.subn(new_bind,js,count=1)
if n!=1:
    raise SystemExit('Bind antigo de subtópicos não encontrado')

assert 'Digite os subtópicos, um por linha' not in js
assert '+ ADICIONAR SUBTÓPICO' in js
assert 'data-remove-subtopic-subject' in js
assert 'Esse subtópico já foi adicionado.' in js
path.write_text(js,'utf-8')
print('Cadastro individual de subtópicos aplicado.')
