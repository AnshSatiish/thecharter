"""Shared text helpers (app/text/normalize.py)."""
from app.text.normalize import fold, is_content_word, split_sentences


def test_split_sentences():
    assert split_sentences("One. Two! Three?") == ["One.", "Two!", "Three?"]
    assert split_sentences("Costs rose 3.5 percent. Dr. Who left.")[0] == "Costs rose 3.5 percent."


def test_split_sentences_breaks_on_blank_lines_and_collapses_whitespace():
    assert split_sentences("A heading\n\nThe   first\nsentence. Second one.") == ["A heading", "The first sentence.", "Second one."]
    assert split_sentences("") == []


def test_fold_lowercases_and_strips_accents():
    assert fold("Darién GAP") == "darien gap"
    assert fold("Señal, Côte d'Ivoire") == "senal, cote d'ivoire"
    assert fold(None) == ""


def test_is_content_word():
    assert is_content_word("fishing")
    assert not is_content_word("the")      # stopword
    assert not is_content_word("ox")       # two letters or fewer
