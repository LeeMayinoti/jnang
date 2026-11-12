"""
Extract Held-Out Story PDFs
============================
Slices individual chapters out of the master corpus
(context/data/Ju'hoan Folktales.pdf) into standalone PDFs, using page ranges
verified by scanning every page for its chapter heading (not the printed
in-book page numbers, which don't map 1:1 to PDF page index).

Two separate output directories, by design:
  - context/data/held_out story files/   -> held-out generalization themes.
    NEVER scanned by context_builder.get_rag_context, so a "does jnang
    generalize beyond its RAG pool" test can't retrieve its own answer key.
  - context/data/individual story files/ -> the real RAG pool. Adding more
    already-formalized stories here gives more preset themes real grounding.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pypdf

_DATA_DIR = Path(__file__).resolve().parent.parent / "context" / "data"
_MASTER_PDF = next(_DATA_DIR.glob("*Folktales*.pdf"))

_RAG_POOL_DIR = _DATA_DIR / "individual story files"
_HELD_OUT_DIR = _DATA_DIR / "held_out story files"

# Full 14-chapter map, verified by scanning all 112 pages for chapter
# headings. 0-indexed pypdf page ranges, inclusive of both ends.
CHAPTER_PAGE_RANGES = {
    1: ("The Moon Dies and Lives Again", 15, 16),
    2: ("The Honey and the Flies", 17, 20),
    3: ("A Woman First Found Fire", 21, 24),
    4: ("The Elephant First Found Water", 25, 30),
    5: ("The Ostrich and the Tortoise", 31, 34),
    6: ("Springhare Dances", 35, 38),
    7: ("Ducks and People", 39, 42),
    8: ("The Sun's Child", 43, 46),
    9: ("The Tamsa Bird", 47, 52),
    10: ("Tug-of-War", 53, 58),
    11: ("Eyes-on-his-Ankles", 59, 64),
    12: ("The Two Boys and the Lions", 65, 72),
    13: ("The Haregirl and the Moon", 73, 82),
    14: ("The Beautiful Elephant Girl", 83, 111),
}

# Chapters 1-2 are already extracted (existing repo files). This run adds
# chapters 3-4 plus all remaining non-held-out chapters (8-14):
RAG_POOL_ADDITIONS = [3, 4, 8, 9, 10, 11, 12, 13, 14]  # -> individual story files/ (real RAG pool)
HELD_OUT_CHAPTERS = [5, 6, 7]      # -> held_out story files/ (never RAG-scanned)


def extract_chapter(master_path: Path, start_idx: int, end_idx: int, out_path: Path) -> None:
    """Copy raw page objects (not re-typed text) so output matches the
    existing extracted files' format exactly."""
    reader = pypdf.PdfReader(str(master_path))
    writer = pypdf.PdfWriter()
    for i in range(start_idx, end_idx + 1):
        writer.add_page(reader.pages[i])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        writer.write(f)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")

    print(f"Master corpus: {_MASTER_PDF}")

    for chapter_num in RAG_POOL_ADDITIONS:
        title, start, end = CHAPTER_PAGE_RANGES[chapter_num]
        out_path = _RAG_POOL_DIR / f"{title}.pdf"
        extract_chapter(_MASTER_PDF, start, end, out_path)
        print(f"[RAG pool]   Chapter {chapter_num} '{title}' -> {out_path}")

    for chapter_num in HELD_OUT_CHAPTERS:
        title, start, end = CHAPTER_PAGE_RANGES[chapter_num]
        out_path = _HELD_OUT_DIR / f"{title}.pdf"
        extract_chapter(_MASTER_PDF, start, end, out_path)
        print(f"[held-out]   Chapter {chapter_num} '{title}' -> {out_path}")

    print("\nDone. RAG pool additions are scanned by get_rag_context(); "
          "held-out files are not and exist only for qualitative reference.")


if __name__ == "__main__":
    main()
