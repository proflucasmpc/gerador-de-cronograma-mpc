from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    function renderAdminEntry(){\n      const entry=el('adminEntryBtn');\n      const switcher=el('adminViewSwitch');\n      const visible=adminRouteRequested()||adminConfigured()||adminUnlocked();\n      if(entry) entry.hidden=!visible||adminUnlocked();\n      if(switcher) switcher.hidden=!adminUnlocked();\n    }\n"""
new="""    function renderAdminEntry(){\n      const entry=el('adminEntryBtn');\n      const switcher=el('adminViewSwitch');\n      const adminRoute=adminRouteRequested();\n      // Controles administrativos nunca aparecem na rota pública do usuário.\n      // O acesso e o alternador de visões ficam restritos a ?admin=1.\n      if(entry) entry.hidden=!adminRoute||adminUnlocked();\n      if(switcher) switcher.hidden=!adminRoute||!adminUnlocked();\n    }\n"""
if old not in s:
    raise SystemExit('renderAdminEntry: bloco não encontrado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('PATCH_ADMIN_CONTROLS_VISIBILITY_OK')
