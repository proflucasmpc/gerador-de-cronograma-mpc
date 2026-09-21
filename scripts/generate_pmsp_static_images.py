from __future__ import annotations

from io import BytesIO
from pathlib import Path
import hashlib
import json

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "correcao-pmsp-2026" / "download" / "prova-pmsp-2026-aluno-soldado.pdf"
OUT = ROOT / "correcao-pmsp-2026" / "imagens-prova"
SCALE = 3.0
WEBP_QUALITY = 92

# Coordenadas em pontos do PDF, origem no canto superior esquerdo.
QUESTIONS = {
    1:(3,28,628,270,172), 2:(3,302,20,270,200), 3:(3,302,223,270,165), 4:(3,302,389,270,165), 5:(3,302,555,270,245),
    6:(4,28,20,270,225), 7:(4,28,248,270,295), 8:(4,28,548,270,252), 9:(4,302,440,270,200), 10:(4,302,643,270,157),
    11:(5,302,20,270,285), 12:(5,302,305,270,495), 13:(6,28,20,270,385), 14:(6,28,410,270,390), 15:(6,302,20,270,315), 16:(6,302,340,270,460),
    17:(7,28,410,270,390), 18:(7,302,20,270,255), 19:(7,302,280,270,195), 20:(7,302,480,270,320),
    21:(8,28,45,270,380), 22:(8,28,430,270,165), 23:(8,28,595,270,205),
    24:(9,28,20,270,210), 25:(9,28,235,270,295), 26:(9,28,535,270,265),
    27:(10,28,20,270,200), 28:(10,28,228,270,180), 29:(10,28,418,270,185), 30:(10,28,615,270,185),
    31:(11,28,20,270,780),
    32:(12,28,238,270,130), 33:(12,28,373,270,245), 34:(12,28,625,270,175),
    35:(13,28,20,270,325), 36:(13,302,95,270,570),
    37:(14,28,20,270,525), 38:(14,302,20,270,430),
    39:(15,28,55,270,605), 40:(15,302,20,270,605),
    41:(16,28,20,270,780), 42:(16,302,50,270,270), 43:(16,302,325,270,480),
    44:(17,28,20,270,290), 45:(17,28,375,270,165), 46:(17,302,20,270,785),
    47:(18,28,20,270,240), 48:(18,28,325,270,265), 49:(18,302,20,270,300), 50:(18,302,325,270,230),
    51:(19,30,58,535,245), 52:(19,30,318,535,180), 53:(19,30,515,535,275),
    54:(20,28,24,270,250), 55:(20,28,292,270,395), 56:(20,302,52,270,235), 57:(20,302,295,270,340),
    58:(21,28,20,270,300), 59:(21,28,330,270,355), 60:(21,302,20,270,190),
}

SHARED = {
    "texto-01-08": (3,28,65,270,555),
    "tira-09-10": (4,302,20,270,415),
    "texto-11-16": (5,28,20,270,780),
    "texto-17-20": (7,28,20,270,385),
    "figura-32-33": (12,28,20,270,215),
}


def render_crop(doc: fitz.Document, spec: tuple[int, float, float, float, float], output: Path) -> dict:
    page_no, x, y, w, h = spec
    page = doc.load_page(page_no - 1)
    page_rect = page.rect
    clip = fitz.Rect(x, y, x + w, y + h)
    if not page_rect.contains(clip):
        raise ValueError(f"Recorte fora da página {page_no}: {clip} / {page_rect}")

    pix = page.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), clip=clip, alpha=False)
    png = pix.tobytes("png")
    with Image.open(BytesIO(png)) as image:
        image = image.convert("RGB")
        output.parent.mkdir(parents=True, exist_ok=True)
        image.save(output, "WEBP", quality=WEBP_QUALITY, method=6)
        width, height = image.size

    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return {
        "page": page_no,
        "crop_points": {"x": x, "y": y, "w": w, "h": h},
        "width": width,
        "height": height,
        "sha256": digest,
    }


def main() -> None:
    if not PDF.exists():
        raise FileNotFoundError(f"PDF não encontrado: {PDF}")

    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "source": str(PDF.relative_to(ROOT)),
        "scale": SCALE,
        "format": "webp",
        "quality": WEBP_QUALITY,
        "questions": {},
        "shared": {},
    }

    with fitz.open(PDF) as doc:
        if doc.page_count < 21:
            raise RuntimeError(f"PDF inesperado: {doc.page_count} páginas")

        for question, spec in QUESTIONS.items():
            name = f"questao-{question:02d}.webp"
            info = render_crop(doc, spec, OUT / name)
            manifest["questions"][str(question)] = {"file": name, **info}

        for name, spec in SHARED.items():
            filename = f"{name}.webp"
            info = render_crop(doc, spec, OUT / filename)
            manifest["shared"][name] = {"file": filename, **info}

    expected = [OUT / f"questao-{n:02d}.webp" for n in range(1, 61)]
    expected += [OUT / f"{name}.webp" for name in SHARED]
    missing = [str(p) for p in expected if not p.exists() or p.stat().st_size < 1000]
    if missing:
        raise RuntimeError("Arquivos ausentes ou vazios: " + ", ".join(missing))

    manifest_path = OUT / "manifesto-recortes.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Gerados {len(QUESTIONS)} recortes de questões + {len(SHARED)} materiais-base.")
    print(f"Destino: {OUT}")


if __name__ == "__main__":
    main()
