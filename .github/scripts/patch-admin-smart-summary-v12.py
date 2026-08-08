from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

old = '''    function renderInsights(){\n      const markup=buildInsightsMarkup(state.tasks);\n      const studentBox=el('insights');\n      const adminBox=el('adminInsights');\n      if(studentBox) studentBox.innerHTML=markup;\n      if(adminBox) adminBox.innerHTML=markup;\n    }'''

new = '''    function renderInsights(){\n      const studentBox=el('insights');\n      if(studentBox) studentBox.innerHTML=buildInsightsMarkup(state.tasks);\n    }\n\n    function renderAdminInsights(showFeedback=false){\n      const box=el('adminInsights');\n      if(!box) return;\n\n      const draft=adminDraftObject();\n      const preview=adminSchedulePreview(draft);\n      if(preview.error){\n        box.innerHTML=`<div class="insight"><strong>Resumo indisponível</strong><p>${preview.error}</p></div>`;\n        if(showFeedback) toast(preview.error);\n        return;\n      }\n\n      const planned=adminBuildStudyTasks(draft,preview);\n      if(planned.error){\n        box.innerHTML=`<div class="insight"><strong>Resumo indisponível</strong><p>${planned.error}</p></div>`;\n        if(showFeedback) toast('A configuração atual precisa ser ajustada antes de calcular o resumo.');\n        return;\n      }\n\n      box.innerHTML=buildInsightsMarkup(planned.tasks);\n      if(showFeedback) toast('Resumo inteligente atualizado com as configurações atuais.');\n    }'''
rep(old,new,'função de resumo')

old_event = '''      el('refreshInsightsBtn').onclick=renderInsights;\n      if(el('adminRefreshInsightsBtn')) el('adminRefreshInsightsBtn').onclick=renderInsights;'''
new_event = '''      el('refreshInsightsBtn').onclick=renderInsights;\n      if(el('adminRefreshInsightsBtn')) el('adminRefreshInsightsBtn').onclick=()=>renderAdminInsights(true);'''
rep(old_event,new_event,'evento do botão administrativo')

old_after_generate = '''      applyScheduleStyleUI();\n      renderSchedule();\n      saveState();\n      saveAdminDraft();'''
new_after_generate = '''      applyScheduleStyleUI();\n      renderSchedule();\n      renderInsights();\n      renderAdminInsights(false);\n      saveState();\n      saveAdminDraft();'''
rep(old_after_generate,new_after_generate,'atualização após gerar cronograma')

p.write_text(s,encoding='utf-8')
print('PATCH_ADMIN_SMART_SUMMARY_V12_OK')
