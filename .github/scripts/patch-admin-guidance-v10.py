from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

def rep(old,new,label):
    global s
    if old not in s:
        raise SystemExit(f'{label}: bloco não encontrado')
    s=s.replace(old,new,1)

# 1) Campo administrativo: Outros critérios -> Orientações gerais.
rep(
'''              <label for="adminExtraCriteria">Outros critérios relevantes</label>\n              <textarea id="adminExtraCriteria" rows="3" placeholder="Ex.: tempo de deslocamento, filhos, curso presencial, necessidade de reforço em determinadas matérias"></textarea>''',
'''              <label for="adminGeneralGuidance">Orientações gerais</label>\n              <textarea id="adminGeneralGuidance" rows="5" placeholder="Escreva aqui as orientações personalizadas que deverão aparecer na segunda página do PDF do cliente."></textarea>\n              <span class="helper">Este texto é exclusivo da área administrativa e será inserido no PDF logo após a página de apresentação.</span>''',
'campo orientações gerais'
)

# 2) Rascunho e hidratação. Mantém compatibilidade com dados antigos.
rep(
"        extraCriteria:el('adminExtraCriteria')?.value.trim()||'',",
"        generalGuidance:el('adminGeneralGuidance')?.value.trim()||'',",
'rascunho orientações'
)
rep(
"      el('adminExtraCriteria').value=draft.extraCriteria||'';",
"      el('adminGeneralGuidance').value=draft.generalGuidance||draft.extraCriteria||'';",
'hidratação orientações'
)
rep(
"        extraCriteria:draft.extraCriteria,",
"        generalGuidance:draft.generalGuidance||draft.extraCriteria||'',",
'personalização orientações'
)

# 3) O antigo campo não deve aparecer como critério da página de apresentação.
s=s.replace("      if(data.extraCriteria) items.push(`outros critérios: ${data.extraCriteria}`);\n", "", 1)

# 4) Cria páginas próprias de orientações, preservando texto e quebrando em mais páginas se necessário.
anchor='''    function pdfBuildPageContent(pageRows,pageIndex,pageCount,layout){'''
if anchor not in s:
    raise SystemExit('âncora PDF não encontrada')

guidance_code=r'''    function pdfAdminGuidanceText(){
      const data=state.adminPersonalization||{};
      return String(data.generalGuidance||data.extraCriteria||'').trim();
    }

    function pdfAdminGuidanceChunks(){
      const text=pdfAdminGuidanceText();
      if(!text) return [];
      const maxWidth=PDF_PAGE.width-PDF_PAGE.margin*2-8;
      const lines=[];
      const paragraphs=text.split(/\r?\n/);
      paragraphs.forEach((paragraph,index)=>{
        const clean=String(paragraph||'').trim();
        if(!clean){
          if(lines.length&&lines.at(-1)!=='') lines.push('');
          return;
        }
        const wrapped=pdfWrapText(clean,maxWidth,11.4,200,false);
        if(index>0&&lines.length&&lines.at(-1)!=='') lines.push('');
        lines.push(...wrapped);
      });
      const maxLinesPerPage=30;
      const chunks=[];
      for(let i=0;i<lines.length;i+=maxLinesPerPage) chunks.push(lines.slice(i,i+maxLinesPerPage));
      return chunks.length?chunks:[[]];
    }

    function pdfBuildAdminGuidancePageContent(lines,pageIndex,pageCount,continuationIndex=0){
      const commands=[];
      const {width,height,margin}=PDF_PAGE;
      const student=String(state.studentName||'CLIENTE').trim()||'CLIENTE';

      pdfRect(commands,0,0,width,height,PDF_COLORS.white);
      pdfRect(commands,0,height-112,width,112,PDF_COLORS.navy);
      pdfRect(commands,margin,height-79,7,42,PDF_COLORS.gold);
      pdfText(commands,margin+19,height-48,'CRONOGRAMA PERSONALIZADO',20,true,PDF_COLORS.white);
      pdfText(commands,margin+19,height-72,'Prof. Lucas MPC',10.5,true,PDF_COLORS.cyan);
      pdfDrawThemeIllustration(commands,'header');
      pdfDrawOptionalLogo(commands);

      const title=`ORIENTAÇÕES PARA ${student.toUpperCase()}`;
      const titleLines=pdfWrapText(title,width-margin*2,19,3,true);
      titleLines.forEach((line,index)=>pdfText(commands,margin,height-154-index*23,line,19,true,PDF_COLORS.navy));
      const titleBottom=height-154-(titleLines.length-1)*23;
      pdfLine(commands,margin,titleBottom-17,width-margin,titleBottom-17,PDF_COLORS.gold,1.4);

      if(continuationIndex>0){
        pdfText(commands,margin,titleBottom-38,`CONTINUAÇÃO ${continuationIndex+1}`,8.7,true,PDF_COLORS.goldDark);
      }

      let y=titleBottom-(continuationIndex>0?64:45);
      (lines||[]).forEach(line=>{
        if(line===''){
          y-=10;
          return;
        }
        pdfText(commands,margin+4,y,line,11.4,false,PDF_COLORS.text);
        y-=16.4;
      });

      pdfLine(commands,margin,78,width-margin,78,PDF_COLORS.gold,1.1);
      pdfText(commands,margin,63,'Orientações personalizadas - Prof. Lucas MPC',8.4,true,PDF_COLORS.navy);
      pdfText(commands,width-margin-92,63,`Página ${pageIndex+1} de ${pageCount}`,8,false,PDF_COLORS.muted,'right',92);
      const button=pdfDrawConfiguredButton(commands);
      return {content:commands.join('\n'),button};
    }

'''
s=s.replace(anchor,guidance_code+anchor,1)

# 5) Insere as orientações logo após a página de apresentação; elas passam a ser a página 2.
old='''        const prepared=pdfPrepareByStyle();
        const hasIntro=Boolean(state.adminGenerated&&state.studentName);
        const totalPages=prepared.pages.length+(hasIntro?1:0);
        const pageDefinitions=[];
        if(hasIntro) pageDefinitions.push(pdfBuildAdminIntroPageContent(0,totalPages));
        let offset=0;
        prepared.pages.forEach((page,index)=>{
          const pageIndex=index+(hasIntro?1:0);
          pageDefinitions.push(pdfBuildStyleDefinition(prepared.kind,page,pageIndex,totalPages,offset));
          if(prepared.kind==='cycle') offset+=page.length;
        });'''
new='''        const prepared=pdfPrepareByStyle();
        const hasIntro=Boolean(state.adminGenerated&&state.studentName);
        const guidanceChunks=hasIntro?pdfAdminGuidanceChunks():[];
        const introCount=hasIntro?1:0;
        const totalPages=prepared.pages.length+introCount+guidanceChunks.length;
        const pageDefinitions=[];
        if(hasIntro) pageDefinitions.push(pdfBuildAdminIntroPageContent(0,totalPages));
        guidanceChunks.forEach((lines,index)=>{
          pageDefinitions.push(pdfBuildAdminGuidancePageContent(lines,introCount+index,totalPages,index));
        });
        let offset=0;
        const contentOffset=introCount+guidanceChunks.length;
        prepared.pages.forEach((page,index)=>{
          const pageIndex=index+contentOffset;
          pageDefinitions.push(pdfBuildStyleDefinition(prepared.kind,page,pageIndex,totalPages,offset));
          if(prepared.kind==='cycle') offset+=page.length;
        });'''
rep(old,new,'ordem das páginas PDF')

p.write_text(s,encoding='utf-8')
print('PATCH_ADMIN_GUIDANCE_V10_OK')
