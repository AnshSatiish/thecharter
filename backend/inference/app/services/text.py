"""Text services: TF-IDF extractive summary, keyword extraction and PDF text extraction.

The extractive summary is pure Python with no model downloads, and serves as a fallback
for the local abstractive summarizer.
"""
import io
import math
import re
import unicodedata
from collections import Counter

METHOD = "extractive-baseline"
SUMMARY_METHOD = "tfidf-extractive"

_EN = """a about above after again against all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her
here hers him his how i if in into is it its just may me might more most must my no nor not of off on once only or
other our out over own same she should so some such than that the their them then there these they this those through
to too under until up upon us very was we were what when where which while who whom why will with would you your
one two many much new however within without across among per via"""
STOPWORDS = frozenset(_EN.split())

_WORD = re.compile(r"[^\W\d_]+(?:['’-][^\W\d_]+)*")
_SENTENCE_END = re.compile(r"(?<=[.!?…])[\"”’)\]]*\s+(?=[\"“‘(\[¿¡]*[A-ZÁÉÍÓÚÑÜ\d])")
_PHRASE_BREAK = re.compile(r"[.,;:!?…()\[\]{}\"“”«»¿¡|/\n]+|\s[-–—]\s")


def fold(text: str) -> str:
    """Lower-case and strip accents, so "Darien" finds "Darién"."""
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


def _is_content(word: str) -> bool:
    return len(word) > 2 and word not in STOPWORDS


def split_sentences(text: str) -> list[str]:
    sentences: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        block = " ".join(block.split())
        sentences += [s.strip() for s in _SENTENCE_END.split(block) if s.strip()]
    return sentences


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

    tokens = [[w for w in (m.lower() for m in _WORD.findall(s)) if _is_content(w)] for s in sentences]
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
        words = _WORD.findall(phrase)
        lowered = [w.lower() for w in words]
        for i, word in enumerate(lowered):
            if not _is_content(word):
                continue
            see(word, words[i], 1)
            if i + 1 < len(words) and _is_content(lowered[i + 1]):
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


def extract_pdf_text(data: bytes) -> tuple[str, int]:
    """Return (text, page count). Scanned PDFs with no text layer give ("", pages).

    Raises ValueError when the bytes are not a readable PDF.
    """
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted and not reader.decrypt(""):
            raise ValueError("PDF is password protected")
        pages = len(reader.pages)
        parts = []
        for page in reader.pages:
            try:
                parts.append(page.extract_text() or "")
            except Exception:  # one unreadable page should not lose the rest
                parts.append("")
    except ValueError:
        raise
    except Exception as exc:  # pypdf raises several unrelated types on corrupt files
        raise ValueError(f"Unreadable PDF: {exc}") from exc
    text = "\n\n".join(p.strip() for p in parts if p.strip())
    return text.replace("\x00", ""), pages
