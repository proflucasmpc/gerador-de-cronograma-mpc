from pathlib import Path

admin=Path('admin.html')
s=admin.read_text()
needle='<script src="/admin-enhancements.js?v=20260813-1"></script>'
if needle not in s:
    needle='<script src="/admin-enhancements.js"></script>'
if needle not in s:
    raise SystemExit('admin enhancements script not found')
replacement=needle+'\n  <script src="/admin-duplicate-plan.js?v=20260813-1"></script>'
if 'admin-duplicate-plan.js' not in s:
    s=s.replace(needle,replacement)
admin.write_text(s)

headers=Path('_headers')
if headers.exists():
    h=headers.read_text()
    if '/admin-duplicate-plan.js' not in h:
        h += '\n/admin-duplicate-plan.js\n  Cache-Control: public, max-age=0, must-revalidate\n'
        headers.write_text(h)
