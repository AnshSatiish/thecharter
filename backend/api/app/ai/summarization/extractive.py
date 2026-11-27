"""TF-IDF + cosine similarity extractive summary: pure Python, no model download. The fallback for the AI model.

Every sentence becomes a TF-IDF vector, the whole document becomes one more vector, and the sentences closest to
the document (highest cosine similarity) are kept, in their original order. The site's in-browser fallback
(frontend/js/features/admin/summarize-local.js) implements the same method.
"""
import math
import re
from collections import Counter

from app.text.normalize import WORD, is_content_word, split_sentences

SUMMARY_METHOD = "tfidf-extractive"
MIN_WORDS = 3  # sentences with fewer content words (headings, fragments) are never chosen
HEADING_WORDS = 12  # a line this short without closing punctuation is a heading (a PDF's title lines)
_LINE_END = re.compile(r"[.!?…:;,][\"”’)\]]*$")
_SENTENCE_DONE = re.compile(r"[.!?…][\"”’)\]]*$")


def _separate_headings(text: str) -> str:
    """Put a blank line after each heading line, so a title is not glued to the first sentence."""
    lines = []
    for line in text.split("\n"):
        lines.append(line)
        bare = line.strip()
        if bare and not _LINE_END.search(bare) and len(bare.split()) <= HEADING_WORDS:
            lines.append("")
    return "\n".join(lines)


def _vector(words: list[str], idf: dict[str, float]) -> dict[str, float]:
    """Unit-length TF-IDF vector: (1 + log tf) * idf for every word."""
    weights = {w: (1 + math.log(c)) * idf[w] for w, c in Counter(words).items()}
    norm = math.sqrt(sum(v * v for v in weights.values())) or 1.0
    return {w: v / norm for w, v in weights.items()}


def _cosine(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(v * b.get(w, 0.0) for w, v in a.items())


def summarize(text: str, max_sentences: int = 3) -> str:
    """Keep the sentences most similar to the whole document (TF-IDF vectors, cosine similarity), in source order.

    IDF is calculated across the input's sentences, so words spread over the whole report weigh less than
    words that mark a few sentences; the document vector carries the report's main topics.
    """
    sentences = split_sentences(_separate_headings(text or ""))
    if max_sentences < 1 or not sentences:
        return ""
    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    tokens = [[w for w in (m.lower() for m in WORD.findall(s)) if is_content_word(w)] for s in sentences]
    document_frequency = Counter(word for words in tokens for word in set(words))
    if not document_frequency:
        return " ".join(sentences[:max_sentences])
    n = len(sentences)
    idf = {w: math.log((n + 1) / (c + 1)) + 1 for w, c in document_frequency.items()}
    document = _vector([w for words in tokens for w in words], idf)
    complete = [bool(_SENTENCE_DONE.search(s)) for s in sentences]
    if not any(complete):  # notes or bullet points without full stops: every line may be chosen
        complete = [True] * n
    similarity = [_cosine(_vector(words, idf), document) if ok and len(words) >= MIN_WORDS else 0.0
                  for words, ok in zip(tokens, complete)]

    best, seen = [], set()
    for i in sorted(range(n), key=lambda i: (-similarity[i], i)):
        key = " ".join(sentences[i].lower().split())
        if key in seen:  # a sentence repeated word for word (e.g. in two photo captions) is used once
            continue
        seen.add(key)
        best.append(i)
        if len(best) == max_sentences:
            break
    return " ".join(sentences[i] for i in sorted(best))
