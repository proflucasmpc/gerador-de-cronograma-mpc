from pathlib import Path

# 1) Sitemap
sitemap = Path('sitemap.xml')
text = sitemap.read_text(encoding='utf-8')
needle = '  <url><loc>https://lucasmpc.com.br/como-estudar-matematica-para-vunesp/</loc><lastmod>2026-09-24</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n'
addition = needle + '  <url><loc>https://lucasmpc.com.br/assuntos-matematica-vunesp/</loc><lastmod>2026-09-24</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n'
if 'https://lucasmpc.com.br/assuntos-matematica-vunesp/' not in text:
    if needle not in text:
        raise SystemExit('Entrada âncora do sitemap não encontrada')
    text = text.replace(needle, addition, 1)
sitemap.write_text(text, encoding='utf-8')

# 2) Link contextual a partir do guia geral
page = Path('como-estudar-matematica-para-vunesp/index.html')
text = page.read_text(encoding='utf-8')
anchor = '<div class="warning"><strong>Atenção:</strong> o fato de um assunto ser comum em concursos não significa que ele estará na sua prova. O conteúdo programático oficial deve prevalecer.</div>'
insert = anchor + '\n<p>Se você quer uma visão organizada por famílias de conteúdo, consulte também <a href="/assuntos-matematica-vunesp/"><strong>Assuntos de Matemática para Vunesp: o que estudar</strong></a>. O guia separa números e operações, porcentagem, proporção, MMC/MDC, equações, gráficos, geometria e outros grupos, sempre com o edital como referência.</p>'
if '/assuntos-matematica-vunesp/' not in text:
    if anchor not in text:
        raise SystemExit('Âncora do guia geral não encontrada')
    text = text.replace(anchor, insert, 1)
page.write_text(text, encoding='utf-8')

print('Sitemap e link interno atualizados.')
