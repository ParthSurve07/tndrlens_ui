"""
AI Service — New PDF Parser using PyMuPDF + PaddleOCR
Replaces the old pypdf/pdfplumber-based parser.
"""
import io
import os
from typing import Optional

# PyMuPDF for text-based PDFs
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("WARNING: PyMuPDF not available. Install with: pip install pymupdf")

# PaddleOCR for scanned/image PDFs
try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
    _ocr = None  # Lazy init (heavy model load)
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("WARNING: PaddleOCR not available. Scanned PDF support disabled. Install with: pip install paddlepaddle paddleocr")


def get_ocr_engine():
    """Lazy-load PaddleOCR to avoid startup delay."""
    global _ocr
    if _ocr is None and PADDLEOCR_AVAILABLE:
        _ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    return _ocr


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.
    - Uses PyMuPDF for text-based PDFs (fast, accurate)
    - Falls back to PaddleOCR for scanned / image-only PDFs
    - Falls back to basic placeholder if neither is available
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    if not PYMUPDF_AVAILABLE:
        raise RuntimeError("PyMuPDF is not installed. Run: pip install pymupdf")

    # ── Step 1: Try PyMuPDF text extraction ──────────────────────
    doc = fitz.open(file_path)
    text_parts = []
    scanned_pages = []

    for page_num, page in enumerate(doc):
        page_text = page.get_text("text").strip()
        if len(page_text) > 50:  # Has meaningful text
            text_parts.append(f"[Page {page_num + 1}]\n{page_text}")
        else:
            # Likely a scanned image page — mark for OCR
            scanned_pages.append(page_num)

    doc.close()

    # If we got good text from most pages, return it
    if len(text_parts) > len(scanned_pages):
        return "\n\n".join(text_parts)

    # ── Step 2: Fallback to PaddleOCR for scanned PDFs ───────────
    if PADDLEOCR_AVAILABLE and scanned_pages:
        return _extract_with_paddleocr(file_path)

    # ── Step 3: Return whatever PyMuPDF got (even if sparse) ─────
    if text_parts:
        return "\n\n".join(text_parts)

    raise ValueError("Could not extract text from PDF. File may be corrupted or empty.")


def _extract_with_paddleocr(file_path: str) -> str:
    """
    OCR a scanned PDF using PaddleOCR.
    Converts each page to an image, then runs OCR.
    """
    ocr = get_ocr_engine()
    doc = fitz.open(file_path)
    all_text = []

    for page_num, page in enumerate(doc):
        # Render page to image at 200 DPI for good OCR quality
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")

        # Run OCR
        result = ocr.ocr(img_bytes, cls=True)
        if result and result[0]:
            page_lines = []
            for line in result[0]:
                if line and len(line) >= 2:
                    text_obj = line[1]
                    if isinstance(text_obj, (list, tuple)) and len(text_obj) >= 1:
                        page_lines.append(str(text_obj[0]))
            if page_lines:
                all_text.append(f"[Page {page_num + 1} — OCR]\n" + "\n".join(page_lines))

    doc.close()
    return "\n\n".join(all_text) if all_text else ""
