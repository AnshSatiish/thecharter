"""PDF text extraction with pypdf."""
import io


def extract_pdf_text(data: bytes) -> tuple[str, int]:
    """Return (text, page count). Scanned PDFs with no text layer give ("", pages).

    Raises ValueError when the bytes are not a readable PDF.
    """
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise ValueError("PDF is password protected")
        pages = len(reader.pages)
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:  # one unreadable page should not lose the rest
                parts.append("")
    except ValueError:
        raise
    except Exception as exc:  # pypdf raises several unrelated types on corrupt files
        raise ValueError(f"Unreadable PDF: {exc}") from exc
    text = "\n\n".join(p.strip() for p in parts if p.strip())
    return text.replace("\x00", ""), pages
