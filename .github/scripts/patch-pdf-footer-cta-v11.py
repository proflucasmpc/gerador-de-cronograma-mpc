from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Remove qualquer identificação do template visual no rodapé do PDF.
s, count = re.subn(
    r"Gerado pelo Gerador de Cronograma MPC · \$\{[^`]+\}",
    "Gerado pelo Gerador de Cronograma MPC",
    s
)
if count < 1:
    raise SystemExit('rodapé com identificação de template não encontrado')

# Melhora a medição horizontal especificamente do CTA padrão em Helvetica Bold.
needle = """    function pdfApproxTextWidth(text,size,bold=false){\n      const clean=pdfSanitizeText(text);\n      let units=0;\n"""
replacement = """    function pdfApproxTextWidth(text,size,bold=false){\n      const clean=pdfSanitizeText(text);\n      if(bold && clean==='CLIQUE AQUI PARA USAR O GERADOR DE CRONOGRAMA MPC GRATUITAMENTE'){\n        const widths={A:722,B:722,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:556,K:722,L:611,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:722,W:944,X:722,Y:722,Z:611,' ':278};\n        let total=0;\n        for(const ch of clean) total+=widths[ch]||667;\n        return (total/1000)*size;\n      }\n      let units=0;\n"""
if needle not in s:
    raise SystemExit('função de medição de texto não encontrada')
s=s.replace(needle,replacement,1)

# Corrige o alinhamento vertical do CTA padrão. As ocorrências com +13 pertencem ao botão padrão do PDF.
cta_y_count=s.count('button.y+13')
if cta_y_count < 1:
    raise SystemExit('posição vertical do CTA não encontrada')
s=s.replace('button.y+13','button.y+17')

p.write_text(s,encoding='utf-8')
print(f'PATCH_PDF_FOOTER_CTA_OK footer_replacements={count} cta_y_replacements={cta_y_count}')
