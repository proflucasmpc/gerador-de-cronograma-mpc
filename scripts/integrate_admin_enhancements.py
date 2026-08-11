from pathlib import Path

path = Path('admin.html')
html = path.read_text(encoding='utf-8')

css_tag = '<link rel="stylesheet" href="/admin-enhancements.css">'
js_tag = '<script src="/admin-enhancements.js"></script>'

if css_tag not in html:
    marker = '</head>'
    if marker not in html:
        raise SystemExit('Marcador </head> não encontrado em admin.html')
    html = html.replace(marker, f'  {css_tag}\n{marker}', 1)

if js_tag not in html:
    marker = '</body>'
    if marker not in html:
        raise SystemExit('Marcador </body> não encontrado em admin.html')
    html = html.replace(marker, f'  {js_tag}\n{marker}', 1)

required = [
    'id="adminPanel"',
    'id="adminGenerateScheduleBtn"',
    'id="adminSaveDraftBtn"',
    'id="adminSubjectsList"',
    'id="adminPdfTheme"',
]
for token in required:
    if token not in html:
        raise SystemExit(f'Elemento administrativo obrigatório ausente: {token}')

path.write_text(html, encoding='utf-8')
print('admin.html integrado sem alterar IDs ou lógica existente.')
