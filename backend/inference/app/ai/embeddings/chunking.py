"""Split text into short passages for embedding.

The sentence model reads about 128 tokens and ignores the rest, so long text is cut into
passages of whole sentences. Each passage starts with the last sentence of the one before,
so an idea that spans two sentences is not lost at the cut.
"""
from app.services.text import split_sentences

MAX_WORDS = 60


def _split_long(sentence: str, max_words: int) -> list[str]:
    words = sentence.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]


def chunk_text(text: str, max_words: int = MAX_WORDS, max_chunks: int | None = None) -> list[str]:
    sentences = [part for s in split_sentences(text or "") for part in _split_long(s, max_words)]
    chunks: list[str] = []
    current: list[str] = []
    count = 0
    for sentence in sentences:
        words = len(sentence.split())
        if current and count + words > max_words:
            chunks.append(" ".join(current))
            if max_chunks and len(chunks) >= max_chunks:
                return chunks
            overlap = current[-1]
            carry = len(overlap.split()) + words <= max_words
            current, count = ([overlap], len(overlap.split())) if carry else ([], 0)
        current.append(sentence)
        count += words
    if current:
        chunks.append(" ".join(current))
    return chunks
