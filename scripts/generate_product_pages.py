#!/usr/bin/env python3
"""Validate the audited static product pages for lucasmpc.com.br.

The audited HTML files are the source of truth. This script checks structure
without rewriting them, preventing a future thin generic template from
accidentally replacing richer SEO content.
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SLUGS = [
    "80-simulados",
    "metodo-ia",
    "como-passar-em-concursos",
    "interpretacao-matematica",
    "manual-do-chute",
    "portugues-para-concursos",
    "combo-matematica",
    "combo-estrategia",
]


def validate(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    if len(re.findall(r"<h1(?:\s|>)", html, re.I)) != 1:
        raise SystemExit(f"{path.name}: expected exactly one H1")
    for marker in ('rel="canonical"', 'name="description"', 'type="application/ld+json"'):
        if marker not in html:
            raise SystemExit(f"{path.name}: missing {marker}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.I | re.S):
        json.loads(block)


for slug in SLUGS:
    page = ROOT / f"{slug}.html"
    if not page.exists():
        raise SystemExit(f"Missing audited page: {page}")
    validate(page)

print(f"Validated {len(SLUGS)} audited product pages; no files rewritten.")
