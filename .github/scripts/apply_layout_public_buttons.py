from pathlib import Path

# admin.html: load wider layout CSS + multi-button manager
p=Path('admin.html')
s=p.read_text()
if '/admin-layout-links.css' not in s:
    s=s.replace('</head>','  <link rel="stylesheet" href="/admin-layout-links.css?v=20260813-1">\n</head>',1)
if '/admin-public-buttons.js' not in s:
    s=s.replace('  <script src="/admin-duplicate-plan.js?v=20260813-1"></script>', '  <script src="/admin-duplicate-plan.js?v=20260813-1"></script>\n  <script src="/admin-public-buttons.js?v=20260813-1"></script>',1)
p.write_text(s)

# plano.html: load public layout/button renderer
p=Path('plano.html')
s=p.read_text()
if '/public-plan-buttons.js' not in s:
    s=s.replace('</body>','  <script src="/public-plan-buttons.js?v=20260813-1" defer></script>\n</body>',1)
p.write_text(s)

# plans API: preserve sanitized custom buttons with each published plan
p=Path('netlify/functions/plans.mjs')
s=p.read_text()
if 'function cleanPublicButton' not in s:
    marker='function cleanTask(task = {}) {'
    insert='''function cleanPublicButton(button = {}) {\n  const rawUrl = cleanString(button.url, 1000);\n  const safeUrl = /^(https?:\\/\\/|mailto:|tel:)/i.test(rawUrl) ? rawUrl : '';\n  const style = ['primary', 'navy', 'gold', 'green', 'outline'].includes(button.style) ? button.style : 'primary';\n  return {\n    text: cleanString(button.text, 80),\n    url: safeUrl,\n    style,\n    enabled: button.enabled !== false\n  };\n}\n\n'''
    s=s.replace(marker,insert+marker,1)
if 'publicPageButtons:' not in s:
    marker='    studyRoutine: cleanStudyRoutine(input.studyRoutine),\n'
    s=s.replace(marker,marker+"    publicPageButtons: Array.isArray(input.publicPageButtons) ? input.publicPageButtons.slice(0, 8).map(cleanPublicButton).filter(button => button.text && button.url) : [],\n",1)
p.write_text(s)

# no-cache headers for new browser modules
p=Path('_headers')
s=p.read_text().rstrip()+"\n"
for path in ['/admin-layout-links.css','/admin-public-buttons.js','/public-plan-buttons.js']:
    stanza=f"{path}\n  Cache-Control: public, max-age=0, must-revalidate\n"
    if path not in s:s+='\n'+stanza
p.write_text(s)
