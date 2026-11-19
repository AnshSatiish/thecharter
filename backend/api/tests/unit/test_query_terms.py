"""How a search query is turned into terms (app/services/search/keyword.py)."""
from app.services.search import query_terms


def test_query_terms():
    assert query_terms("The Darién Gap") == ["darien", "gap"]
    assert query_terms("the of") == ["the", "of"]
    assert query_terms("  ") == []


def test_query_terms_drops_stopwords_but_keeps_the_rest_in_order():
    assert query_terms("grief rituals in the rural communities") == ["grief", "rituals", "rural", "communities"]


def test_query_terms_ignores_punctuation():
    assert query_terms("Nairobi, protests!") == ["nairobi", "protests"]
    assert query_terms("?!") == []
