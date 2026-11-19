"""Keyword suggestions: frequent content words and repeated two-word phrases. Pure Python, no model."""
import re
from collections import Counter

from app.text.normalize import WORD, is_content_word

KEYWORD_METHOD = "extractive-baseline"

_PHRASE_BREAK = re.compile(r"[.,;:!?…()\[\]{}\"“”«»¿¡|/\n]+|\s[-–—]\s")


def extract_keywords(text: str, top_k: int = 8) -> list[str]:
    """Frequent content words and two-word phrases, most important first.

    Phrases must repeat to count. Results keep the casing of their first occurrence
    and do not repeat a word already covered by an earlier keyword.
    """
    if top_k < 1 or not (text or "").strip():
        return []
    scores: Counter[str] = Counter()
    surface: dict[str, str] = {}
    order: dict[str, int] = {}

    def see(key: str, shown: str, weight: float) -> None:
        scores[key] += weight
        surface.setdefault(key, shown)
        order.setdefault(key, len(order))

    for phrase in _PHRASE_BREAK.split(text):
        words = WORD.findall(phrase)
        lowered = [w.lower() for w in words]
        for i, word in enumerate(lowered):
            if not is_content_word(word):
                continue
            see(word, words[i], 1)
            if i + 1 < len(words) and is_content_word(lowered[i + 1]):
                see(f"{word} {lowered[i + 1]}", f"{words[i]} {words[i + 1]}", 2.25)

    candidates = [k for k in scores if " " not in k or scores[k] >= 4.5]  # a phrase needs two occurrences
    candidates.sort(key=lambda k: (-scores[k], order[k]))
    chosen: list[str] = []
    used: set[str] = set()
    for key in candidates:
        parts = set(key.split())
        if parts & used:
            continue
        used |= parts
        chosen.append(surface[key])
        if len(chosen) == top_k:
            break
    return chosen
