from pathlib import Path

path = Path('plano.html')
text = path.read_text(encoding='utf-8')
marker = '<script src="/user-plan-attribution.js" defer></script>'
loader = '<script src="/pomodoro.js?v=20260812-1" defer></script>'

if loader in text:
    raise SystemExit('Pomodoro já carregado.')
if marker not in text:
    raise SystemExit('Marcador da página pública não encontrado.')

text = text.replace(marker, marker + '\n' + loader, 1)
path.write_text(text, encoding='utf-8')
