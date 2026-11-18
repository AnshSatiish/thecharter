"""Transformers summarizer used only by the offline model comparison script."""
import re
import threading

from app.services.text import split_sentences


class TransformersSummarizer:
    """Summarize text with a Hugging Face sequence-to-sequence model."""

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
                except Exception as exc:
                    raise RuntimeError(f"Could not load {self.name}: {exc}") from exc
        return self._tokenizer, self._model

    def _generate(self, text: str) -> str:
        try:
            import torch

            tokenizer, model = self._load()
            inputs = tokenizer(self.prefix + text, return_tensors="pt", truncation=True, max_length=512)
            with torch.no_grad():
                output = model.generate(**inputs, max_new_tokens=self.max_new_tokens, num_beams=self.num_beams,
                                        no_repeat_ngram_size=3, early_stopping=self.num_beams > 1)
            summary = tokenizer.decode(output[0], skip_special_tokens=True).strip()
            if not summary:
                raise RuntimeError(f"{self.name} returned an empty summary")
            return re.sub(r"\s+([.,;:!?])", r"\1", summary)
        except Exception as exc:
            raise RuntimeError(f"Could not generate a summary with {self.name}: {exc}") from exc

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
        partial = [self._generate(piece) for piece in pieces[:max_pieces]]
        return partial[0] if len(partial) == 1 else self._generate(" ".join(partial))
