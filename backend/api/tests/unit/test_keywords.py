"""Keyword suggestions (app/ai/keywords.py)."""
from app.ai.keywords import extract_keywords

EN = (
    "Lake Kivu sits on the border between Rwanda and the Democratic Republic of Congo. "
    "Fishing communities around Lake Kivu depend on the sambaza catch for food and income. "
    "The weather was pleasant on the day we arrived. "
    "Methane extraction and plastic pollution now threaten the fishing communities and the lake itself. "
    "A local guide recommended a restaurant. "
    "Researchers warn that fishing communities could lose their income if the lake keeps warming."
)


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
