"""PDF text extraction (app/text/pdf.py)."""
from app.text.pdf import extract_pdf_text
from tests.conftest import make_pdf


def test_extract_pdf_text():
    text, pages = extract_pdf_text(make_pdf(["Glaciers retreat in Patagonia.", "Second page here."]))
    assert pages == 2
    assert "Glaciers retreat in Patagonia." in text and "Second page here." in text


def test_extract_pdf_without_text_layer():
    assert extract_pdf_text(make_pdf([""])) == ("", 1)
