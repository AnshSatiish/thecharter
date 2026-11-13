from app.services.text import extract_keywords, extract_pdf_text, split_sentences, summarize
from tests.conftest import make_pdf

EN = (
    "Lake Kivu sits on the border between Rwanda and the Democratic Republic of Congo. "
    "Fishing communities around Lake Kivu depend on the sambaza catch for food and income. "
    "The weather was pleasant on the day we arrived. "
    "Methane extraction and plastic pollution now threaten the fishing communities and the lake itself. "
    "A local guide recommended a restaurant. "
    "Researchers warn that fishing communities could lose their income if the lake keeps warming."
)


def test_split_sentences():
    assert split_sentences("One. Two! Three?") == ["One.", "Two!", "Three?"]
    assert split_sentences("Costs rose 3.5 percent. Dr. Who left.")[0] == "Costs rose 3.5 percent."


def test_summarize_english_keeps_order_and_drops_filler():
    summary = summarize(EN, max_sentences=3)
    sentences = split_sentences(summary)
    assert len(sentences) == 3
    assert "weather" not in summary and "restaurant" not in summary
    assert "fishing communities" in summary.lower()
    positions = [EN.index(s) for s in sentences]
    assert positions == sorted(positions)


def test_summarize_tfidf_prefers_distinctive_sentences():
    text = (
        "The community faces severe flooding across several villages. "
        "The community faces flooding in the villages. "
        "The community faces flooding near the villages. "
        "The community faces flooding beyond the villages."
    )
    assert summarize(text, max_sentences=1) == "The community faces severe flooding across several villages."



def test_summarize_short_and_empty_text():
    assert summarize("") == ""
    assert summarize("   \n ") == ""
    assert summarize("Just one sentence here.") == "Just one sentence here."
    assert summarize("First. Second.", max_sentences=5) == "First. Second."
    assert summarize(EN, max_sentences=0) == ""


def test_keywords_english():
    keywords = extract_keywords(EN, top_k=5)
    assert len(keywords) == 5
    lowered = [k.lower() for k in keywords]
    assert "fishing communities" in lowered  # repeated phrase kept together
    assert "Lake Kivu" in keywords  # original casing
    assert not {"the", "and", "on"} & set(lowered)
    # No word repeated across keywords
    words = [w for k in lowered for w in k.split()]
    assert len(words) == len(set(words))



def test_keywords_edge_cases():
    assert extract_keywords("") == []
    assert extract_keywords("the and of") == []
    assert extract_keywords(EN, top_k=2) == extract_keywords(EN, top_k=8)[:2]


def test_extract_pdf_text():
    text, pages = extract_pdf_text(make_pdf(["Glaciers retreat in Patagonia.", "Second page here."]))
    assert pages == 2
    assert "Glaciers retreat in Patagonia." in text and "Second page here." in text


def test_extract_pdf_without_text_layer():
    assert extract_pdf_text(make_pdf([""])) == ("", 1)
