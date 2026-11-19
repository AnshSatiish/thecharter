"""Text helpers shared by search, keyword extraction and summarization: folding, stopwords, sentences, words."""
import re
import unicodedata

_EN = """a about above after again against all also am an and any are as at be because been before being below
between both but by can could did do does doing down during each few for from further had has have having he her
here hers him his how i if in into is it its just may me might more most must my no nor not of off on once only or
other our out over own same she should so some such than that the their them then there these they this those through
to too under until up upon us very was we were what when where which while who whom why will with would you your
one two many much new however within without across among per via"""
STOPWORDS = frozenset(_EN.split())

# A word: letters, optionally joined by an apostrophe or hyphen ("don't", "cross-border").
WORD = re.compile(r"[^\W\d_]+(?:['’-][^\W\d_]+)*")
_SENTENCE_END = re.compile(r"(?<=[.!?…])[\"”’)\]]*\s+(?=[\"“‘(\[¿¡]*[A-ZÁÉÍÓÚÑÜ\d])")


def fold(text: str) -> str:
    """Lower-case and strip accents, so "Darien" finds "Darién"."""
    decomposed = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


def is_content_word(word: str) -> bool:
    """True for a lower-cased word worth counting: longer than two letters and not a stopword."""
    return len(word) > 2 and word not in STOPWORDS


def split_sentences(text: str) -> list[str]:
    """Split text into sentences. Blank lines always end a sentence; whitespace inside one is collapsed."""
    sentences: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        block = " ".join(block.split())
        sentences += [s.strip() for s in _SENTENCE_END.split(block) if s.strip()]
    return sentences
