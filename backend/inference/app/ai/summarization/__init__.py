"""AI summarization of project text with an open-source sequence-to-sequence model.

The model writes a new short summary (abstractive), unlike the word-frequency baseline in
services/text.py, which only copies sentences. It runs on this machine with PyTorch, so there is
no API key and no cost; it is downloaded once into the Hugging Face cache. The model and its
generation settings were chosen by cross-validation (backend/model_training/evaluate_summarizers.py).

The summary is always a draft: the administrator reviews, edits and confirms it before it is saved.
"""
import re
import threading

from app.core.config import get_settings
from app.services.text import split_sentences


class SummarizerUnavailable(RuntimeError):
    """AI summarization is switched off, or the model or PyTorch could not be loaded."""


class AbstractiveSummarizer:
    """Summarizes long text in pieces: each piece is summarized, then the piece summaries are joined
    and summarized again if needed, because the models read a limited number of tokens."""

    def __init__(self, name: str, max_new_tokens: int = 90, num_beams: int = 4, prefix: str = "") -> None:
        self.name = name
        self.max_new_tokens = max_new_tokens
        self.num_beams = num_beams
        self.prefix = prefix
        self._model = None
        self._tokenizer = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is None:
                try:
                    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

                    self._tokenizer = AutoTokenizer.from_pretrained(self.name)
                    self._model = AutoModelForSeq2SeqLM.from_pretrained(self.name)
                    self._model.eval()
                except Exception as exc:  # transformers or torch missing, no network for the first download
                    raise SummarizerUnavailable(f"Could not load {self.name}: {exc}") from exc
        return self._tokenizer, self._model

    def _generate(self, text: str) -> str:
        import torch

        tokenizer, model = self._load()
        inputs = tokenizer(self.prefix + text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=self.max_new_tokens, num_beams=self.num_beams,
                                    no_repeat_ngram_size=3, early_stopping=self.num_beams > 1)
        text = tokenizer.decode(output[0], skip_special_tokens=True).strip()
        return re.sub(r"\s+([.,;:!?])", r"\1", text)  # some models put a space before punctuation

    def summarize(self, text: str, piece_words: int = 350, max_pieces: int = 6) -> str:
        sentences = split_sentences(text or "")
        if not sentences:
            return ""
        pieces, current = [], []
        for sentence in sentences:
            if current and sum(len(s.split()) for s in current) + len(sentence.split()) > piece_words:
                pieces.append(" ".join(current))
                current = []
            current.append(sentence)
        pieces.append(" ".join(current))
        partial = [self._generate(p) for p in pieces[:max_pieces]]
        return partial[0] if len(partial) == 1 else self._generate(" ".join(partial))


_summarizer: AbstractiveSummarizer | None = None


def get_summarizer() -> AbstractiveSummarizer:
    global _summarizer
    settings = get_settings()
    if not settings.ai_summary:
        raise SummarizerUnavailable("AI summarization is switched off (AI_SUMMARY=false)")
    if _summarizer is None:
        _summarizer = AbstractiveSummarizer(settings.summary_model, settings.summary_max_new_tokens,
                                            settings.summary_num_beams, settings.summary_prefix)
    return _summarizer


def set_summarizer(summarizer: AbstractiveSummarizer | None) -> None:
    """Swap the summarizer (tests use a stand-in). None restores the configured model."""
    global _summarizer
    _summarizer = summarizer
