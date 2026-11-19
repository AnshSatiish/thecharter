"""Splitting text into overlapping passages for embedding (app/ai/embeddings/chunking.py)."""
from app.ai.embeddings.chunking import chunk_text


def test_chunk_text():
    assert chunk_text("") == []
    assert chunk_text("One short sentence.") == ["One short sentence."]
    text = " ".join(f"Sentence number {i} has exactly seven words." for i in range(30))
    chunks = chunk_text(text, max_words=20)
    assert all(len(c.split()) <= 20 for c in chunks)
    assert chunks[1].startswith(chunks[0].split(". ")[-1][:10])  # passages overlap by one sentence
    assert len(chunk_text(text, max_words=20, max_chunks=3)) == 3
    assert all(len(c.split()) <= 20 for c in chunk_text("word " * 100, max_words=20))


def test_one_long_sentence_is_cut_by_word_count():
    chunks = chunk_text(" ".join(f"w{i}" for i in range(45)) + ".", max_words=20)
    assert [len(c.split()) for c in chunks] == [20, 20, 5]


def test_every_word_is_kept():
    text = " ".join(f"Sentence {i} talks about lake fishing." for i in range(12))
    joined = " ".join(chunk_text(text, max_words=15))
    assert all(f"Sentence {i} " in joined for i in range(12))
