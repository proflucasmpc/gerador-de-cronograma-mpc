from pathlib import Path
import base64
import gzip
import re

path = Path('area-usuario.html')
html = path.read_text('utf-8')

# O preview de origem é um invólucro que descompacta o HTML real no navegador.
# Se deixarmos esse invólucro intacto, as alterações feitas em guided-user.js
# não são carregadas pela página exibida no Deploy Preview.
if '<script src="/guided-user.js"></script>' not in html:
    match = re.search(r"const b='([^']+)'", html)
    if match:
        try:
            html = gzip.decompress(base64.b64decode(match.group(1))).decode('utf-8')
        except Exception as exc:
            raise SystemExit(f'Falha ao descompactar area-usuario.html: {exc}')

# Reaplica as pequenas adaptações da versão real, agora sobre o HTML
# efetivamente exibido ao usuário.
html = html.replace(
    '<li>Sua área administrativa continuará separada e sem alterações.</li>',
    '<li>Seu acesso continua liberado enquanto você monta o cronograma.</li>'
)
html = html.replace(
    '<button class="preview-test" id="simulate15">PRÉVIA: SIMULAR 15 MINUTOS</button>',
    ''
)
html = html.replace(
    '#simulate15{display:none}body.preview-mode #simulate15{display:inline-flex!important}',
    ''
)

if '<script src="/guided-user.js"></script>' not in html:
    html, count = re.subn(
        r'<script>\s*\(\(\)=>\{.*?</script>',
        '<script src="/guided-user.js"></script>',
        html,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise SystemExit('Script inline da área guiada não encontrado para substituição.')

if '<script src="/guided-user.js"></script>' not in html:
    raise SystemExit('guided-user.js não foi conectado à página real.')
if "const b='" in html or 'DecompressionStream' in html:
    raise SystemExit('O invólucro compactado ainda está presente em area-usuario.html.')

path.write_text(html, 'utf-8')
print('Página real da área guiada normalizada e conectada a guided-user.js.')
