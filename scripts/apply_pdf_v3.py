from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')


def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: esperado 1 trecho, encontrado {count}')
    text = text.replace(old, new, 1)


def regex_once(pattern, replacement, label, flags=0):
    global text
    text2, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: esperado 1 trecho, encontrado {count}')
    text = text2

# 1) Versão de dados e defaults novos (compatíveis com estados antigos).
replace_once("const DATA_SCHEMA_VERSION = 8;", "const DATA_SCHEMA_VERSION = 9;", 'schema')
replace_once(
"""      adminGenerated: false,\n      adminPlanDays: 0,\n      adminPersonalization: null,\n      goal: '', examDate: '', hoursPerDay: 2, sessionMinutes: 60, preferredStart: '19:00',""",
"""      adminGenerated: false,\n      adminPlanDays: 0,\n      adminPersonalization: null,\n      adminPdfTheme: 'premium_masculino',\n      adminPdfButtonEnabled: false,\n      adminPdfButtonText: 'Acesse aqui',\n      adminPdfButtonUrl: '',\n      adminPdfButtonPosition: 'footer-right',\n      goal: '', examDate: '', hoursPerDay: 2, sessionMinutes: 60, preferredStart: '19:00',""",
'defaults pdf')

# 2) CSS da nova área PDF e diagnóstico.
css_anchor = """    .admin-capacity-error { color: var(--danger); font-weight: 800; }\n    .admin-capacity-ok { color: var(--success); font-weight: 800; }"""
css_new = css_anchor + """
    .admin-pdf-card { display: grid; gap: 14px; }
    .admin-pdf-theme-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
    .admin-pdf-button-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; }
    .admin-pdf-toggle {
      display: flex; align-items: flex-start; gap: 10px; padding: 12px;
      border: 1px solid var(--border); border-radius: 12px; background: var(--surface);
    }
    .admin-pdf-toggle input { width: 19px; height: 19px; margin-top: 1px; accent-color: var(--gold); }
    .admin-pdf-theme-note, .admin-distribution-preview {
      padding: 12px 14px; border: 1px solid var(--border); border-radius: 12px;
      background: var(--surface); color: var(--muted); font-size: .86rem; line-height: 1.5;
    }
    .admin-distribution-preview strong { color: var(--text); }
    .admin-distribution-preview.warning { border-color: var(--danger); background: var(--danger-bg); }
    .admin-distribution-preview.ok { border-color: color-mix(in srgb, var(--success) 55%, var(--border)); background: var(--success-bg); }
    @media (max-width: 700px) {
      .admin-pdf-theme-grid, .admin-pdf-button-grid { grid-template-columns: 1fr; }
    }"""
replace_once(css_anchor, css_new, 'css pdf admin')

# 3) Nova seção administrativa de personalização do PDF.
admin_anchor = """      <section class=\"admin-card admin-generate-card\">\n        <div>\n          <h3>6. Gere o cronograma personalizado</h3>"""
admin_pdf_section = """      <section class=\"admin-card admin-pdf-card\">\n        <div>\n          <h3>6. Personalização do PDF</h3>\n          <p class=\"helper\">O formato do PDF seguirá o tipo de cronograma escolhido acima. Aqui você escolhe apenas a identidade visual e, se desejar, um botão clicável personalizado.</p>\n        </div>\n\n        <div class=\"admin-pdf-theme-grid\">\n          <div class=\"field full\">\n            <label for=\"adminPdfTheme\">Modelo visual do PDF</label>\n            <select id=\"adminPdfTheme\">\n              <optgroup label=\"Modelos femininos\">\n                <option value=\"policial_feminino\">Policial Feminino</option>\n                <option value=\"vestibular_feminino\">Vestibular Feminino</option>\n                <option value=\"elegante_feminino\">Elegante Feminino</option>\n                <option value=\"minimalista_feminino\">Minimalista Feminino</option>\n                <option value=\"premium_feminino\">Premium Feminino</option>\n              </optgroup>\n              <optgroup label=\"Modelos masculinos\">\n                <option value=\"policial_masculino\">Policial Masculino</option>\n                <option value=\"vestibular_masculino\">Vestibular Masculino</option>\n                <option value=\"executivo_masculino\">Executivo Masculino</option>\n                <option value=\"minimalista_masculino\">Minimalista Masculino</option>\n                <option value=\"premium_masculino\" selected>Premium Masculino</option>\n              </optgroup>\n            </select>\n          </div>\n        </div>\n        <div class=\"admin-pdf-theme-note\" id=\"adminPdfThemeNote\">O modelo visual é independente do tipo de cronograma. Assim, checklist, ciclo, semanal e quantidade de dias podem usar qualquer um dos 10 modelos.</div>\n\n        <label class=\"admin-pdf-toggle\">\n          <input id=\"adminPdfButtonEnabled\" type=\"checkbox\">\n          <span><strong>Adicionar botão personalizado ao PDF</strong><br><span class=\"helper\">Quando desativado, o PDF mantém o botão padrão do Gerador MPC.</span></span>\n        </label>\n\n        <div class=\"admin-pdf-button-grid\">\n          <div class=\"field\">\n            <label for=\"adminPdfButtonText\">Texto do botão</label>\n            <input id=\"adminPdfButtonText\" list=\"adminPdfButtonSuggestions\" type=\"text\" maxlength=\"70\" placeholder=\"Ex.: Conheça minha mentoria\">\n            <datalist id=\"adminPdfButtonSuggestions\">\n              <option value=\"Acesse o curso\"></option>\n              <option value=\"Conheça a mentoria\"></option>\n              <option value=\"Material complementar\"></option>\n              <option value=\"Fale comigo\"></option>\n              <option value=\"Conheça nossos materiais\"></option>\n              <option value=\"Continue seus estudos\"></option>\n            </datalist>\n          </div>\n          <div class=\"field\">\n            <label for=\"adminPdfButtonUrl\">Link do botão</label>\n            <input id=\"adminPdfButtonUrl\" type=\"url\" inputmode=\"url\" placeholder=\"https://...\">\n          </div>\n          <div class=\"field full\">\n            <label for=\"adminPdfButtonPosition\">Posição do botão</label>\n            <select id=\"adminPdfButtonPosition\">\n              <option value=\"header-left\">Cabeçalho — lado esquerdo</option>\n              <option value=\"header-right\">Cabeçalho — lado direito</option>\n              <option value=\"footer-left\">Rodapé — lado esquerdo</option>\n              <option value=\"footer-right\" selected>Rodapé — lado direito</option>\n            </select>\n          </div>\n        </div>\n\n        <div class=\"admin-distribution-preview\" id=\"adminDistributionPreview\">A análise da distribuição aparecerá aqui depois que as matérias e os tópicos forem preenchidos.</div>\n      </section>\n\n      <section class=\"admin-card admin-generate-card\">\n        <div>\n          <h3>7. Gere o cronograma personalizado</h3>"""
replace_once(admin_anchor, admin_pdf_section, 'seção pdf admin')

# 4) Persistência dos novos campos no rascunho.
replace_once(
"""        simulationMinutes:Math.max(10,Number(el('adminSimulationMinutes')?.value)||240),\n        simulationStart:el('adminSimulationStart')?.value||'08:00',\n        subjects:adminSubjects.map(subject=>({...subject}))""",
"""        simulationMinutes:Math.max(10,Number(el('adminSimulationMinutes')?.value)||240),\n        simulationStart:el('adminSimulationStart')?.value||'08:00',\n        pdfTheme:el('adminPdfTheme')?.value||'premium_masculino',\n        pdfButtonEnabled:Boolean(el('adminPdfButtonEnabled')?.checked),\n        pdfButtonText:el('adminPdfButtonText')?.value.trim()||'Acesse aqui',\n        pdfButtonUrl:el('adminPdfButtonUrl')?.value.trim()||'',\n        pdfButtonPosition:el('adminPdfButtonPosition')?.value||'footer-right',\n        subjects:adminSubjects.map(subject=>({...subject}))""",
'admin draft pdf')

replace_once(
"""      el('adminSimulationMinutes').value=draft.simulationMinutes||240;\n      el('adminSimulationStart').value=draft.simulationStart||'08:00';\n\n      const start=dateFromKey(el('adminStartDate').value);""",
"""      el('adminSimulationMinutes').value=draft.simulationMinutes||240;\n      el('adminSimulationStart').value=draft.simulationStart||'08:00';\n      el('adminPdfTheme').value=draft.pdfTheme||state.adminPdfTheme||state.adminPersonalization?.pdfTheme||'premium_masculino';\n      el('adminPdfButtonEnabled').checked=Boolean(draft.pdfButtonEnabled??state.adminPdfButtonEnabled??state.adminPersonalization?.pdfButtonEnabled);\n      el('adminPdfButtonText').value=draft.pdfButtonText||state.adminPdfButtonText||state.adminPersonalization?.pdfButtonText||'Acesse aqui';\n      el('adminPdfButtonUrl').value=draft.pdfButtonUrl||state.adminPdfButtonUrl||state.adminPersonalization?.pdfButtonUrl||'';\n      el('adminPdfButtonPosition').value=draft.pdfButtonPosition||state.adminPdfButtonPosition||state.adminPersonalization?.pdfButtonPosition||'footer-right';\n      renderAdminPdfSettings();\n\n      const start=dateFromKey(el('adminStartDate').value);""",
'hydrate pdf')

# 5) Distribuição proporcional: mantém a ordem interna de cada matéria e espalha as filas por todo o período.
regex_once(
    r"    function interleaveAdminUnits\(queues\)\{.*?\n    \}\n\n    function adminSchedulePreview",
"""    function interleaveAdminUnits(queues){
      const active=queues
        .filter(queue=>queue.units.length)
        .map((queue,index)=>({
          queue,
          index,
          total:queue.units.length,
          cursor:0,
          scheduled:0
        }));
      const totalUnits=active.reduce((sum,item)=>sum+item.total,0);
      const result=[];
      let lastSubject='';

      for(let step=0;step<totalUnits;step++){
        const candidates=active.filter(item=>item.cursor<item.total);
        candidates.sort((a,b)=>{
          const expectedA=((step+1)*a.total)/totalUnits;
          const expectedB=((step+1)*b.total)/totalUnits;
          const deficitA=expectedA-a.scheduled-(a.queue.subject.name===lastSubject&&candidates.length>1?.32:0);
          const deficitB=expectedB-b.scheduled-(b.queue.subject.name===lastSubject&&candidates.length>1?.32:0);
          if(Math.abs(deficitB-deficitA)>.0001) return deficitB-deficitA;
          const remainingA=(a.total-a.cursor)/a.total;
          const remainingB=(b.total-b.cursor)/b.total;
          if(Math.abs(remainingB-remainingA)>.0001) return remainingB-remainingA;
          return a.index-b.index;
        });
        const chosen=candidates[0];
        const unit=chosen.queue.units[chosen.cursor++];
        chosen.scheduled++;
        result.push(unit);
        lastSubject=chosen.queue.subject.name;
      }
      return result;
    }

    function adminDistributionDiagnostics(units){
      const total=units.length;
      if(!total) return {summary:[],warnings:[]};
      const map=new Map();
      units.forEach((unit,index)=>{
        if(!map.has(unit.subject)) map.set(unit.subject,[]);
        map.get(unit.subject).push(index);
      });
      const tailStart=Math.floor(total*.75);
      const summary=[];
      const warnings=[];
      map.forEach((positions,subject)=>{
        const tailCount=positions.filter(position=>position>=tailStart).length;
        const tailRatio=positions.length?tailCount/positions.length:0;
        let maxGap=0;
        for(let i=1;i<positions.length;i++) maxGap=Math.max(maxGap,positions[i]-positions[i-1]);
        summary.push({subject,count:positions.length,first:positions[0],last:positions.at(-1),tailRatio,maxGap});
        if(positions.length>=6&&tailRatio>.45){
          warnings.push(`${subject} está excessivamente concentrada na parte final do cronograma.`);
        }
      });
      return {summary,warnings};
    }

    function renderAdminDistributionPreview(preview){
      const box=el('adminDistributionPreview');
      if(!box) return;
      if(!preview||preview.error){
        box.className='admin-distribution-preview';
        box.textContent='A análise da distribuição aparecerá aqui depois que as matérias e os tópicos forem preenchidos.';
        return;
      }
      const diagnostics=preview.diagnostics||adminDistributionDiagnostics(preview.units||[]);
      const parts=diagnostics.summary.map(item=>`${escapeHtml(item.subject)}: ${item.count} atividade${item.count===1?'':'s'}`);
      if(diagnostics.warnings.length){
        box.className='admin-distribution-preview warning';
        box.innerHTML=`<strong>Atenção à distribuição:</strong> ${diagnostics.warnings.map(escapeHtml).join(' ')}<br>${parts.join(' · ')}`;
      }else{
        box.className='admin-distribution-preview ok';
        box.innerHTML=`<strong>Distribuição verificada:</strong> as matérias estão espalhadas proporcionalmente ao longo do planejamento.<br>${parts.join(' · ')}`;
      }
    }

    function adminSchedulePreview""",
    'algoritmo equilibrado',
    flags=re.S
)

replace_once(
"""      const requiredMinutes=units.reduce((sum,unit)=>sum+unit.duration,0)+Math.max(0,units.length-studyDates.length)*10;\n      return {window,queues,units,simDates,simKeys,studyDates,availableMinutes,requiredMinutes};""",
"""      const requiredMinutes=units.reduce((sum,unit)=>sum+unit.duration,0)+Math.max(0,units.length-studyDates.length)*10;\n      const diagnostics=adminDistributionDiagnostics(units);\n      return {window,queues,units,simDates,simKeys,studyDates,availableMinutes,requiredMinutes,diagnostics};""",
'preview diagnostics')

replace_once(
"""      if(preview.error){\n        label.className='helper';\n        label.textContent=preview.error;\n        return;\n      }""",
"""      if(preview.error){\n        label.className='helper';\n        label.textContent=preview.error;\n        renderAdminDistributionPreview(preview);\n        return;\n      }""",
'preview erro')
replace_once(
"""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${fits?' O plano cabe no período.':' O plano não cabe no período com as configurações atuais.'}`;\n    }""",
"""      label.textContent=`Período: ${preview.window.days} dias corridos, ${preview.studyDates.length} dias de estudo e ${preview.simDates.length} dias exclusivos de simulado. Capacidade aproximada: ${formatHours(preview.availableMinutes)}; atividades previstas: ${preview.units.length}, com cerca de ${formatHours(preview.requiredMinutes)}.${fits?' O plano cabe no período.':' O plano não cabe no período com as configurações atuais.'}`;\n      renderAdminDistributionPreview(preview);\n    }""",
'preview render diagnostics')

# 6) Metadados de personalização armazenados no cronograma gerado.
replace_once(
"""        simulationInterval:draft.simulationInterval,\n        simulationWeekday:draft.simulationWeekday,\n        simulationCount:preview.simDates.length""",
"""        simulationInterval:draft.simulationInterval,\n        simulationWeekday:draft.simulationWeekday,\n        simulationCount:preview.simDates.length,\n        pdfTheme:draft.pdfTheme,\n        pdfButtonEnabled:draft.pdfButtonEnabled,\n        pdfButtonText:draft.pdfButtonText,\n        pdfButtonUrl:draft.pdfButtonUrl,\n        pdfButtonPosition:draft.pdfButtonPosition""",
'personalization pdf')

replace_once(
"""      state.adminGenerated=true;\n      state.adminPlanDays=preview.window.days;\n      state.adminPersonalization=adminPersonalizationData(draft,preview);""",
"""      state.adminGenerated=true;\n      state.adminPlanDays=preview.window.days;\n      state.adminPdfTheme=draft.pdfTheme;\n      state.adminPdfButtonEnabled=draft.pdfButtonEnabled;\n      state.adminPdfButtonText=draft.pdfButtonText;\n      state.adminPdfButtonUrl=draft.pdfButtonUrl;\n      state.adminPdfButtonPosition=draft.pdfButtonPosition;\n      state.adminPersonalization=adminPersonalizationData(draft,preview);""",
'state pdf')

# 7) Ajuda visual da configuração do PDF.
insert_before_dates = """    function updateAdminDaysAvailable(){"""
pdf_settings_fn = """    const ADMIN_PDF_THEME_LABELS={
      policial_feminino:'Policial Feminino', vestibular_feminino:'Vestibular Feminino', elegante_feminino:'Elegante Feminino', minimalista_feminino:'Minimalista Feminino', premium_feminino:'Premium Feminino',
      policial_masculino:'Policial Masculino', vestibular_masculino:'Vestibular Masculino', executivo_masculino:'Executivo Masculino', minimalista_masculino:'Minimalista Masculino', premium_masculino:'Premium Masculino'
    };

    function renderAdminPdfSettings(){
      const note=el('adminPdfThemeNote');
      const theme=el('adminPdfTheme')?.value||'premium_masculino';
      const enabled=Boolean(el('adminPdfButtonEnabled')?.checked);
      if(note) note.textContent=`Modelo selecionado: ${ADMIN_PDF_THEME_LABELS[theme]||'Premium Masculino'}. O visual é independente do formato do cronograma.`;
      ['adminPdfButtonText','adminPdfButtonUrl','adminPdfButtonPosition'].forEach(id=>{
        const field=el(id);
        if(field) field.disabled=!enabled;
      });
    }

""" + insert_before_dates
replace_once(insert_before_dates, pdf_settings_fn, 'render pdf settings')

# 8) Eventos para atualizar visualmente controles de PDF.
replace_once(
"""      el('adminSimulationMode').addEventListener('change',()=>{\n        renderAdminSimulationFields();\n        saveAdminDraft();\n        updateAdminCapacityPreview();\n      });""",
"""      el('adminSimulationMode').addEventListener('change',()=>{\n        renderAdminSimulationFields();\n        saveAdminDraft();\n        updateAdminCapacityPreview();\n      });\n      el('adminPdfTheme').addEventListener('change',()=>{ renderAdminPdfSettings(); saveAdminDraft(); });\n      el('adminPdfButtonEnabled').addEventListener('change',()=>{ renderAdminPdfSettings(); saveAdminDraft(); });""",
'eventos pdf')

# 9) Temas visuais do PDF. Mantém a API de PDF_COLORS para reduzir regressões.
pdf_theme_js = r"""    const PDF_THEME_PRESETS={
      policial_feminino:{label:'Policial Feminino',colors:{navy:[0.07,0.12,0.22],navy2:[0.18,0.23,0.34],gold:[0.75,0.35,0.43],goldDark:[0.48,0.15,0.22],cyan:[0.77,0.61,0.67],text:[0.07,0.09,0.14],muted:[0.35,0.38,0.44],line:[0.82,0.83,0.86],soft:[0.97,0.95,0.96],white:[1,1,1],success:[0.08,0.42,0.28],successSoft:[0.91,0.97,0.93],pendingSoft:[0.99,0.94,0.95]}},
      vestibular_feminino:{label:'Vestibular Feminino',colors:{navy:[0.25,0.10,0.31],navy2:[0.43,0.18,0.47],gold:[0.94,0.45,0.45],goldDark:[0.66,0.22,0.30],cyan:[0.93,0.66,0.73],text:[0.13,0.07,0.16],muted:[0.39,0.32,0.42],line:[0.86,0.81,0.87],soft:[0.98,0.95,0.98],white:[1,1,1],success:[0.10,0.46,0.30],successSoft:[0.91,0.97,0.93],pendingSoft:[1,0.95,0.93]}},
      elegante_feminino:{label:'Elegante Feminino',colors:{navy:[0.25,0.08,0.16],navy2:[0.43,0.16,0.26],gold:[0.78,0.54,0.48],goldDark:[0.52,0.29,0.27],cyan:[0.90,0.72,0.73],text:[0.15,0.08,0.11],muted:[0.40,0.34,0.36],line:[0.87,0.82,0.83],soft:[0.98,0.96,0.96],white:[1,1,1],success:[0.10,0.44,0.30],successSoft:[0.91,0.97,0.93],pendingSoft:[0.99,0.95,0.93]}},
      minimalista_feminino:{label:'Minimalista Feminino',colors:{navy:[0.16,0.17,0.20],navy2:[0.30,0.31,0.35],gold:[0.72,0.50,0.56],goldDark:[0.47,0.30,0.34],cyan:[0.82,0.70,0.73],text:[0.10,0.10,0.12],muted:[0.39,0.40,0.43],line:[0.84,0.84,0.86],soft:[0.97,0.97,0.98],white:[1,1,1],success:[0.10,0.43,0.29],successSoft:[0.91,0.97,0.93],pendingSoft:[0.98,0.96,0.97]}},
      premium_feminino:{label:'Premium Feminino',colors:{navy:[0.17,0.08,0.25],navy2:[0.34,0.16,0.43],gold:[0.84,0.66,0.45],goldDark:[0.57,0.41,0.24],cyan:[0.83,0.68,0.83],text:[0.10,0.06,0.14],muted:[0.39,0.33,0.42],line:[0.85,0.81,0.86],soft:[0.98,0.96,0.98],white:[1,1,1],success:[0.09,0.44,0.29],successSoft:[0.91,0.97,0.93],pendingSoft:[1,0.97,0.91]}},
      policial_masculino:{label:'Policial Masculino',colors:{navy:[0.02,0.07,0.14],navy2:[0.07,0.16,0.27],gold:[0.40,0.56,0.67],goldDark:[0.20,0.34,0.44],cyan:[0.48,0.72,0.82],text:[0.04,0.08,0.13],muted:[0.30,0.36,0.42],line:[0.80,0.84,0.87],soft:[0.95,0.97,0.98],white:[1,1,1],success:[0.07,0.43,0.27],successSoft:[0.91,0.97,0.93],pendingSoft:[0.94,0.97,0.99]}},
      vestibular_masculino:{label:'Vestibular Masculino',colors:{navy:[0.02,0.20,0.23],navy2:[0.04,0.35,0.39],gold:[0.93,0.48,0.18],goldDark:[0.64,0.29,0.08],cyan:[0.32,0.72,0.72],text:[0.04,0.12,0.13],muted:[0.31,0.39,0.40],line:[0.80,0.86,0.86],soft:[0.95,0.98,0.98],white:[1,1,1],success:[0.07,0.43,0.27],successSoft:[0.91,0.97,0.93],pendingSoft:[1,0.96,0.90]}},
      executivo_masculino:{label:'Executivo Masculino',colors:{navy:[0.07,0.10,0.15],navy2:[0.15,0.20,0.28],gold:[0.32,0.50,0.70],goldDark:[0.18,0.34,0.52],cyan:[0.47,0.67,0.85],text:[0.06,0.08,0.12],muted:[0.34,0.38,0.44],line:[0.82,0.84,0.87],soft:[0.96,0.97,0.98],white:[1,1,1],success:[0.07,0.43,0.27],successSoft:[0.91,0.97,0.93],pendingSoft:[0.94,0.97,1]}},
      minimalista_masculino:{label:'Minimalista Masculino',colors:{navy:[0.12,0.14,0.17],navy2:[0.24,0.27,0.31],gold:[0.46,0.52,0.58],goldDark:[0.27,0.32,0.37],cyan:[0.62,0.68,0.73],text:[0.08,0.09,0.11],muted:[0.38,0.40,0.43],line:[0.84,0.85,0.86],soft:[0.97,0.97,0.97],white:[1,1,1],success:[0.08,0.42,0.27],successSoft:[0.91,0.97,0.93],pendingSoft:[0.96,0.97,0.98]}},
      premium_masculino:{label:'Premium Masculino',colors:{navy:[0.027,0.082,0.169],navy2:[0.055,0.122,0.231],gold:[0.839,0.663,0.157],goldDark:[0.541,0.408,0],cyan:[0.235,0.745,0.835],text:[0.055,0.102,0.18],muted:[0.29,0.35,0.44],line:[0.82,0.86,0.91],soft:[0.965,0.976,0.989],white:[1,1,1],success:[0.075,0.45,0.27],successSoft:[0.91,0.97,0.93],pendingSoft:[1,0.975,0.89]}}
    };
    let PDF_COLORS={...PDF_THEME_PRESETS.premium_masculino.colors};

    function pdfApplySelectedTheme(){
      const key=state.adminPersonalization?.pdfTheme||state.adminPdfTheme||'premium_masculino';
      const preset=PDF_THEME_PRESETS[key]||PDF_THEME_PRESETS.premium_masculino;
      PDF_COLORS={...preset.colors};
      return preset;
    }"""
regex_once(r"    const PDF_COLORS=\{.*?\n    \};", pdf_theme_js, 'temas pdf', flags=re.S)

# 10) URL/link configurável: a anotação PDF usa a URL específica da página quando fornecida.
replace_once(
"""const annotationRef=addObject(`<< /Type /Annot /Subtype /Link /Rect [${pdfNumber(x)} ${pdfNumber(y)} ${pdfNumber(x+width)} ${pdfNumber(y+height)}] /Border [0 0 0] /H /I /A << /S /URI /URI (${pdfEscapeText(PDF_GENERATOR_URL)}) >> >>`);""",
"""const annotationUrl=definition.button?.url||PDF_GENERATOR_URL;\n        const annotationRef=addObject(`<< /Type /Annot /Subtype /Link /Rect [${pdfNumber(x)} ${pdfNumber(y)} ${pdfNumber(x+width)} ${pdfNumber(y+height)}] /Border [0 0 0] /H /I /A << /S /URI /URI (${pdfEscapeText(annotationUrl)}) >> >>`);""",
'url anotação pdf')

# 11) Quatro renderizações estruturais distintas para PDF.
style_pdf_code = r"""
    function pdfSafeHttpUrl(value){
      try{
        const url=new URL(String(value||''));
        return ['http:','https:'].includes(url.protocol)?url.href:'';
      }catch{return '';}
    }

    function pdfButtonConfig(){
      const data=state.adminPersonalization||{};
      const customUrl=pdfSafeHttpUrl(data.pdfButtonUrl||state.adminPdfButtonUrl||'');
      const custom=Boolean((data.pdfButtonEnabled??state.adminPdfButtonEnabled)&&customUrl);
      return custom ? {
        custom:true,
        label:pdfSanitizeText(data.pdfButtonText||state.adminPdfButtonText||'Acesse aqui').slice(0,70)||'Acesse aqui',
        url:customUrl,
        position:data.pdfButtonPosition||state.adminPdfButtonPosition||'footer-right'
      } : {
        custom:false,
        label:'CLIQUE AQUI PARA USAR O GERADOR DE CRONOGRAMA MPC GRATUITAMENTE',
        url:PDF_GENERATOR_URL,
        position:'footer-full'
      };
    }

    function pdfDrawConfiguredButton(commands){
      const {width,height,margin}=PDF_PAGE;
      const cfg=pdfButtonConfig();
      if(!cfg.custom){
        const button={x:margin,y:18,width:width-margin*2,height:38,url:cfg.url};
        pdfRect(commands,button.x,button.y,button.width,button.height,PDF_COLORS.gold,PDF_COLORS.goldDark,1.1);
        pdfText(commands,button.x,button.y+13,cfg.label,9.6,true,PDF_COLORS.navy,'center',button.width);
        return button;
      }
      const buttonWidth=190;
      const buttonHeight=28;
      const right=cfg.position.endsWith('right');
      const header=cfg.position.startsWith('header');
      const button={
        x:right?width-margin-buttonWidth:margin,
        y:header?height-141:24,
        width:buttonWidth,
        height:buttonHeight,
        url:cfg.url
      };
      pdfRect(commands,button.x,button.y,button.width,button.height,PDF_COLORS.gold,PDF_COLORS.goldDark,.9);
      const label=pdfWrapText(cfg.label,button.width-18,8.7,1,true)[0];
      pdfText(commands,button.x,button.y+9.5,label,8.7,true,PDF_COLORS.navy,'center',button.width);
      return button;
    }

    function pdfDrawStyleChrome(commands,pageIndex,pageCount,sectionTitle){
      const {width,height,margin}=PDF_PAGE;
      pdfRect(commands,0,0,width,height,PDF_COLORS.white);
      pdfRect(commands,0,height-86,width,86,PDF_COLORS.navy);
      pdfRect(commands,margin,height-62,7,31,PDF_COLORS.gold);
      pdfText(commands,margin+18,height-43,'CRONOGRAMA DE ESTUDOS',21,true,PDF_COLORS.white);
      pdfText(commands,margin+18,height-63,sectionTitle||pdfScheduleStyleLabel(),10.2,true,PDF_COLORS.cyan);

      const objective=pdfWrapText(`Objetivo: ${state.goal||'Não informado'}`,width-margin*2,10.6,1,true)[0];
      pdfText(commands,margin,height-107,objective,10.6,true,PDF_COLORS.text);
      if(state.studentName){
        const student=pdfWrapText(`Aluno: ${state.studentName}`,width-margin*2,9.6,1,true)[0];
        pdfText(commands,margin,height-124,student,9.6,true,PDF_COLORS.muted);
      }

      pdfLine(commands,margin,78,width-margin,78,PDF_COLORS.gold,1.1);
      pdfText(commands,margin,63,`Gerado pelo Gerador de Cronograma MPC · ${PDF_THEME_PRESETS[state.adminPersonalization?.pdfTheme||state.adminPdfTheme]?.label||'Premium Masculino'}`,7.9,true,PDF_COLORS.navy);
      pdfText(commands,width-margin-92,63,`Página ${pageIndex+1} de ${pageCount}`,8,false,PDF_COLORS.muted,'right',92);
      const button=pdfDrawConfiguredButton(commands);
      return {bodyTop:state.adminPersonalization?.pdfButtonEnabled&&String(state.adminPersonalization?.pdfButtonPosition||'').startsWith('header')?680:690,bodyBottom:92,button};
    }

    function pdfChunk(items,size){
      const out=[];
      for(let i=0;i<items.length;i+=size) out.push(items.slice(i,i+size));
      return out.length?out:[[]];
    }

    function pdfSortedTasks(){
      return [...state.tasks].sort((a,b)=>
        (a.date||'9999-12-31').localeCompare(b.date||'9999-12-31')||
        (a.cycleOrder??9999)-(b.cycleOrder??9999)||
        a.day-b.day||
        (a.start||'').localeCompare(b.start||'')
      );
    }

    function pdfPrepareChecklistStyle(){
      return pdfChunk(pdfSortedTasks(),11);
    }

    function pdfBuildChecklistStylePage(tasks,pageIndex,pageCount){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,'CHECKLIST DE ESTUDOS');
      let y=chrome.bodyTop;
      tasks.forEach((task,index)=>{
        const done=Boolean(task.done);
        pdfRect(commands,PDF_PAGE.margin,y-13,13,13,done?PDF_COLORS.successSoft:PDF_COLORS.white,done?PDF_COLORS.success:PDF_COLORS.line,1);
        if(done) pdfText(commands,PDF_PAGE.margin+2.7,y-10,'X',9,true,PDF_COLORS.success);
        const subject=pdfWrapText(task.subject||'Disciplina',355,10.8,1,true)[0];
        const activity=pdfWrapText(task.activity||'Atividade de estudo',355,9.4,1,false)[0];
        pdfText(commands,PDF_PAGE.margin+24,y-2,subject,10.8,true,PDF_COLORS.navy);
        pdfText(commands,PDF_PAGE.margin+24,y-17,activity,9.4,false,PDF_COLORS.text);
        const meta=task.date?pdfDateLabel(task):`${task.type||'Estudo'} · ${task.start||''}${task.end?`–${task.end}`:''}`;
        pdfText(commands,PDF_PAGE.width-PDF_PAGE.margin-132,y-9,pdfWrapText(meta,132,7.8,2,false)[0],7.8,false,PDF_COLORS.muted,'right',132);
        pdfLine(commands,PDF_PAGE.margin,y-31,PDF_PAGE.width-PDF_PAGE.margin,y-31,PDF_COLORS.line,.55);
        y-=48;
      });
      if(!tasks.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhum item cadastrado.',12,true,PDF_COLORS.muted);
      return {content:commands.join('\n'),button:chrome.button};
    }

    function pdfPrepareCycleStyle(){
      const ordered=[...state.tasks].sort((a,b)=>(a.cycleOrder??9999)-(b.cycleOrder??9999)||a.day-b.day||(a.start||'').localeCompare(b.start||''));
      return pdfChunk(ordered,8);
    }

    function pdfBuildCycleStylePage(tasks,pageIndex,pageCount,pageOffset=0){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,'CRONOGRAMA POR CICLOS');
      let y=chrome.bodyTop;
      tasks.forEach((task,index)=>{
        const number=pageOffset+index+1;
        pdfRect(commands,PDF_PAGE.margin,y-39,40,40,index===0&&pageIndex===0?PDF_COLORS.gold:PDF_COLORS.navy,null,0);
        pdfText(commands,PDF_PAGE.margin,y-25,String(number),14,true,index===0&&pageIndex===0?PDF_COLORS.navy:PDF_COLORS.white,'center',40);
        const x=PDF_PAGE.margin+54;
        pdfText(commands,x,y-6,pdfWrapText(task.subject||'Disciplina',390,12.2,1,true)[0],12.2,true,PDF_COLORS.navy);
        pdfText(commands,x,y-22,pdfWrapText(task.activity||'Atividade',390,9.7,1,false)[0],9.7,false,PDF_COLORS.text);
        pdfText(commands,x,y-37,`${task.type||'Estudo'} · ${formatHours(taskDuration(task))}${task.done?' · Concluída':''}`,8.2,true,task.done?PDF_COLORS.success:PDF_COLORS.muted);
        pdfLine(commands,PDF_PAGE.margin,y-51,PDF_PAGE.width-PDF_PAGE.margin,y-51,PDF_COLORS.line,.6);
        y-=65;
      });
      if(!tasks.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhuma etapa cadastrada.',12,true,PDF_COLORS.muted);
      return {content:commands.join('\n'),button:chrome.button};
    }

    function pdfWeekKey(task){
      if(!task.date) return `sem-data-${task.day}`;
      const date=new Date(`${task.date}T12:00:00`);
      if(Number.isNaN(date.getTime())) return `sem-data-${task.day}`;
      const monday=new Date(date);
      monday.setDate(date.getDate()-((date.getDay()+6)%7));
      return localDateKey(monday);
    }

    function pdfPrepareWeeklyStyle(){
      const groups=[];
      const map=new Map();
      pdfSortedTasks().forEach(task=>{
        const key=pdfWeekKey(task);
        if(!map.has(key)){
          const group={key,tasks:[]}; map.set(key,group); groups.push(group);
        }
        map.get(key).tasks.push(task);
      });
      const pages=[];
      groups.forEach((group,weekIndex)=>{
        const byDay=[];
        const dayMap=new Map();
        group.tasks.forEach(task=>{
          const key=task.date||`day-${task.day}`;
          if(!dayMap.has(key)){ const day={key,tasks:[]};dayMap.set(key,day);byDay.push(day); }
          dayMap.get(key).tasks.push(task);
        });
        let page={weekIndex,items:[],height:0};
        byDay.forEach(day=>{
          const h=30+day.tasks.length*31;
          if(page.items.length&&page.height+h>510){ pages.push(page); page={weekIndex,items:[],height:0}; }
          page.items.push(day); page.height+=h;
        });
        if(page.items.length) pages.push(page);
      });
      return pages.length?pages:[{weekIndex:0,items:[],height:0}];
    }

    function pdfBuildWeeklyStylePage(page,pageIndex,pageCount){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,'PLANEJAMENTO SEMANAL');
      let y=chrome.bodyTop;
      pdfText(commands,PDF_PAGE.margin,y,`SEMANA ${page.weekIndex+1}`,13,true,PDF_COLORS.goldDark); y-=22;
      page.items.forEach(day=>{
        const first=day.tasks[0];
        const label=first?.date?pdfDateLabel(first):(DAYS[first?.day]||'Dia de estudo');
        pdfRect(commands,PDF_PAGE.margin,y-20,PDF_PAGE.width-PDF_PAGE.margin*2,22,PDF_COLORS.soft,PDF_COLORS.line,.6);
        pdfText(commands,PDF_PAGE.margin+10,y-14,label,9.4,true,PDF_COLORS.navy);
        y-=31;
        day.tasks.forEach(task=>{
          pdfText(commands,PDF_PAGE.margin+12,y,`${task.start||''}${task.end?`–${task.end}`:''}`,8,true,PDF_COLORS.muted);
          pdfText(commands,PDF_PAGE.margin+82,y,pdfWrapText(`${task.subject} — ${task.activity}`,PDF_PAGE.width-PDF_PAGE.margin*2-94,9.1,1,false)[0],9.1,false,PDF_COLORS.text);
          y-=31;
        });
        y-=4;
      });
      if(!page.items.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhuma atividade semanal cadastrada.',12,true,PDF_COLORS.muted);
      return {content:commands.join('\n'),button:chrome.button};
    }

    function pdfAdminCalendarDates(){
      const data=state.adminPersonalization||{};
      const start=dateFromKey(data.startDate);
      const end=dateFromKey(data.endDate);
      if(!start||!end||end<start) return [];
      const dates=[];
      for(let date=new Date(start);date<=end;date=addCalendarDays(date,1)) dates.push(new Date(date));
      return dates;
    }

    function pdfPrepareDaysStyle(){
      const tasksByDate=new Map();
      pdfSortedTasks().forEach(task=>{
        const key=task.date||`day-${task.day}`;
        if(!tasksByDate.has(key)) tasksByDate.set(key,[]);
        tasksByDate.get(key).push(task);
      });
      const dates=state.adminGenerated?pdfAdminCalendarDates():[];
      const days=dates.length?dates.map((date,index)=>({
        index,
        key:localDateKey(date),
        date,
        tasks:tasksByDate.get(localDateKey(date))||[]
      })):Array.from(tasksByDate.entries()).map(([key,tasks],index)=>({index,key,date:null,tasks}));
      const pages=[];
      let page={items:[],height:0};
      days.forEach(day=>{
        const h=Math.max(58,42+day.tasks.length*25);
        if(page.items.length&&page.height+h>520){ pages.push(page);page={items:[],height:0}; }
        page.items.push(day);page.height+=h;
      });
      if(page.items.length) pages.push(page);
      return pages.length?pages:[{items:[],height:0}];
    }

    function pdfBuildDaysStylePage(page,pageIndex,pageCount){
      const commands=[];
      const chrome=pdfDrawStyleChrome(commands,pageIndex,pageCount,state.adminGenerated?'CRONOGRAMA POR QUANTIDADE DE DIAS':'CALENDÁRIO MENSAL');
      let y=chrome.bodyTop;
      const totalDays=state.adminPlanDays||state.adminPersonalization?.planDays||page.items.length;
      page.items.forEach(day=>{
        const dateLabel=day.date?`${DAYS[(day.date.getDay()+6)%7]} · ${day.date.toLocaleDateString('pt-BR')}`:(day.tasks[0]?pdfDateLabel(day.tasks[0]):'Dia de estudo');
        const title=state.adminGenerated?`DIA ${day.index+1} DE ${totalDays}`:'DIA DO PLANEJAMENTO';
        const panelHeight=Math.max(58,42+day.tasks.length*25);
        pdfRect(commands,PDF_PAGE.margin,y-panelHeight,PDF_PAGE.width-PDF_PAGE.margin*2,panelHeight,PDF_COLORS.white,PDF_COLORS.line,.8);
        pdfRect(commands,PDF_PAGE.margin,y-27,PDF_PAGE.width-PDF_PAGE.margin*2,27,PDF_COLORS.soft,PDF_COLORS.line,.5);
        pdfText(commands,PDF_PAGE.margin+10,y-18,title,9.2,true,PDF_COLORS.goldDark);
        pdfText(commands,PDF_PAGE.margin+165,y-18,dateLabel,8.8,true,PDF_COLORS.navy);
        let taskY=y-43;
        if(!day.tasks.length){
          pdfText(commands,PDF_PAGE.margin+12,taskY,'Sem estudo regular programado neste dia.',8.8,false,PDF_COLORS.muted);
        }else{
          day.tasks.forEach(task=>{
            pdfText(commands,PDF_PAGE.margin+12,taskY,`${task.start||''}${task.end?`–${task.end}`:''}`,7.8,true,PDF_COLORS.muted);
            pdfText(commands,PDF_PAGE.margin+79,taskY,pdfWrapText(`${task.subject} — ${task.activity}`,PDF_PAGE.width-PDF_PAGE.margin*2-91,8.8,1,false)[0],8.8,false,PDF_COLORS.text);
            taskY-=25;
          });
        }
        y-=panelHeight+9;
      });
      if(!page.items.length) pdfText(commands,PDF_PAGE.margin,chrome.bodyTop-30,'Nenhum dia encontrado para o período.',12,true,PDF_COLORS.muted);
      return {content:commands.join('\n'),button:chrome.button};
    }

    function pdfPrepareByStyle(){
      if(state.scheduleStyle==='checklist') return {kind:'checklist',pages:pdfPrepareChecklistStyle()};
      if(state.scheduleStyle==='cycle') return {kind:'cycle',pages:pdfPrepareCycleStyle()};
      if(state.scheduleStyle==='monthly') return {kind:'monthly',pages:pdfPrepareDaysStyle()};
      return {kind:'weekly',pages:pdfPrepareWeeklyStyle()};
    }

    function pdfBuildStyleDefinition(kind,page,pageIndex,pageCount,offset){
      if(kind==='checklist') return pdfBuildChecklistStylePage(page,pageIndex,pageCount);
      if(kind==='cycle') return pdfBuildCycleStylePage(page,pageIndex,pageCount,offset);
      if(kind==='monthly') return pdfBuildDaysStylePage(page,pageIndex,pageCount);
      return pdfBuildWeeklyStylePage(page,pageIndex,pageCount);
    }

"""
replace_once("    function pdfBuildBinary(pageDefinitions){", style_pdf_code + "    function pdfBuildBinary(pageDefinitions){", 'renderizadores estilos pdf')

# 12) Dispatch do PDF por estilo e tema.
regex_once(
    r"    function buildSchedulePdfBytes\(\)\{.*?\n    \}\n\n    function exportPdf",
"""    function buildSchedulePdfBytes(){
      pdfApplySelectedTheme();
      const prepared=pdfPrepareByStyle();
      const hasIntro=Boolean(state.adminGenerated&&state.studentName);
      const totalPages=prepared.pages.length+(hasIntro?1:0);
      const pageDefinitions=[];
      if(hasIntro) pageDefinitions.push(pdfBuildAdminIntroPageContent(0,totalPages));
      let offset=0;
      prepared.pages.forEach((page,index)=>{
        const pageIndex=index+(hasIntro?1:0);
        pageDefinitions.push(pdfBuildStyleDefinition(prepared.kind,page,pageIndex,totalPages,offset));
        if(prepared.kind==='cycle') offset+=page.length;
      });
      return pdfBuildBinary(pageDefinitions);
    }

    function exportPdf""",
    'dispatch pdf',
    flags=re.S
)

# 13) Mensagem de exportação deixa de afirmar apenas "vertical" e informa o estilo real.
replace_once(
"toast('PDF vertical baixado, com leitura otimizada para celular e computador.');",
"toast(`${pdfScheduleStyleLabel()} baixado em PDF com o modelo visual selecionado.`);",
'mensagem pdf')

# 14) O reset preserva as preferências administrativas de PDF quando existirem.
replace_once(
"""        palette:state.palette || 'classic'\n      };""",
"""        palette:state.palette || 'classic',\n        adminPdfTheme:state.adminPdfTheme||'premium_masculino',\n        adminPdfButtonEnabled:Boolean(state.adminPdfButtonEnabled),\n        adminPdfButtonText:state.adminPdfButtonText||'Acesse aqui',\n        adminPdfButtonUrl:state.adminPdfButtonUrl||'',\n        adminPdfButtonPosition:state.adminPdfButtonPosition||'footer-right'\n      };""",
'reset preserva pdf')

# 15) Sanidades finais.
required = [
    'policial_feminino','vestibular_feminino','premium_feminino',
    'policial_masculino','vestibular_masculino','premium_masculino',
    'adminPdfButtonUrl','adminDistributionPreview','pdfPrepareByStyle',
    'pdfBuildChecklistStylePage','pdfBuildCycleStylePage','pdfBuildWeeklyStylePage','pdfBuildDaysStylePage'
]
for marker in required:
    if marker not in text:
        raise SystemExit(f'Marcador obrigatório ausente: {marker}')

path.write_text(text, encoding='utf-8')
print('index.html atualizado com sucesso')
