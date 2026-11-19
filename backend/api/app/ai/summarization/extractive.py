"""TF-IDF extractive summary: pure Python, no model download. The fallback for the abstractive model."""
import math
from collections import Counter

from app.text.normalize import WORD, is_content_word, split_sentences

SUMMARY_METHOD = "tfidf-extractive"


def summarize(text: str, max_sentences: int = 3) -> str:
    """Pick sentences with the highest TF-IDF score, preserving source order.

    IDF is calculated across the input's sentences, and term frequency across the
    document boosts recurring topics over one-off details.
    """
    sentences = split_sentences(text or "")
    if max_sentences < 1 or not sentences:
        return ""
    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    tokens = [[w for w in (m.lower() for m in WORD.findall(s)) if is_content_word(w)] for s in sentences]
    document_frequency = Counter(word for words in tokens for word in set(words))
    if not document_frequency:
        return " ".join(sentences[:max_sentences])
    sentence_count = len(sentences)
    document_term_frequency = Counter(word for words in tokens for word in words)
    term_weight = {
        word: (1 + math.log(document_term_frequency[word]))
        * (math.log((sentence_count + 1) / (count + 1)) + 1)
        for word, count in document_frequency.items()
    }

    def score(i: int) -> float:
        words = tokens[i]
        if len(words) < 3:  # headings and fragments
            return 0.0
        term_frequency = Counter(words)
        weighted_terms = sum(
            (1 + math.log(count)) * term_weight[word]
            for word, count in term_frequency.items()
        )
        base = weighted_terms / math.sqrt(len(words))
        return base * (1 + 0.2 * (1 - i / len(sentences)))

    best = sorted(range(len(sentences)), key=lambda i: (-score(i), i))[:max_sentences]
    return " ".join(sentences[i] for i in sorted(best))
