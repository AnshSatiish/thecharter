"""Local AI summaries through Ollama, with a TF-IDF sentence-selection fallback.

The PDF text is sent only to the Ollama server on this machine (SUMMARY_OLLAMA_URL). Administrators review
and edit generated summaries before saving them.
"""
import json
import re
from collections.abc import Callable
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.ai.summarization.extractive import SUMMARY_METHOD
from app.ai.summarization.extractive import summarize as summarize_extractive
from app.core.config import get_settings
from app.text.normalize import split_sentences

_SUMMARY_INTRO = re.compile(
    r"^(?:here(?:'s| is)\s+(?:a\s+)?summary"
    r"(?:\s+of\s+(?:the\s+)?(?:report|document|text))?"
    r"(?:\s+in\s+\d+\s+concise\s+sentences?)?|summary)\s*:?\s*",
    re.IGNORECASE,
)


class SummarizerUnavailable(RuntimeError):
    """AI summarization is switched off, or the local model cannot be used."""


class Summarizer(Protocol):
    name: str

    def summarize(self, text: str) -> str: ...


def _summarize_in_chunks(text: str, generate: Callable[[str], str], piece_words: int, max_pieces: int) -> str:
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
    partial = [generate(piece) for piece in pieces[:max_pieces]]
    return partial[0] if len(partial) == 1 else generate(" ".join(partial))


class OllamaSummarizer:
    """Generate faithful report summaries using a local Ollama server."""

    def __init__(
        self,
        name: str,
        base_url: str = "http://localhost:11434",
        max_new_tokens: int = 60,
        timeout_seconds: float = 300,
    ) -> None:
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.max_new_tokens = max_new_tokens
        self.timeout_seconds = timeout_seconds

    def _generate(self, text: str) -> str:
        prompt = (
            "Summarize this report accurately in 2 or 3 concise sentences. "
            "Preserve its key people, places, issues, and findings. Use only facts in the report; "
            "do not add assumptions.\n\n"
            f"REPORT:\n{text}\n\nSUMMARY:"
        )
        body = json.dumps({
            "model": self.name,
            "system": "Output only the summary sentences. Do not add a heading, introduction, or commentary.",
            "prompt": prompt,
            "stream": False,
            "options": {"num_predict": self.max_new_tokens, "temperature": 0.1},
        }).encode("utf-8")
        request = Request(
            f"{self.base_url}/api/generate",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace").strip()
            raise SummarizerUnavailable(f"Ollama returned HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise SummarizerUnavailable(f"Could not connect to Ollama at {self.base_url}: {exc.reason}") from exc
        except (TimeoutError, OSError) as exc:
            raise SummarizerUnavailable(f"Ollama request failed: {exc}") from exc
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise SummarizerUnavailable(f"Ollama returned an invalid response: {exc}") from exc

        if not isinstance(result, dict):
            raise SummarizerUnavailable("Ollama returned an invalid response")
        if result.get("error"):
            raise SummarizerUnavailable(f"Ollama error: {result['error']}")
        if result.get("done_reason") == "length":
            raise SummarizerUnavailable(f"{self.name} reached the output token limit")
        summary = result.get("response")
        if not isinstance(summary, str) or not summary.strip():
            raise SummarizerUnavailable(f"{self.name} returned an empty summary")
        summary = _SUMMARY_INTRO.sub("", summary.strip())
        summary = re.sub(r"\s+([.,;:!?])", r"\1", summary).strip()
        if not summary:
            raise SummarizerUnavailable(f"{self.name} returned no summary sentences")
        return summary

    def summarize(self, text: str, piece_words: int = 350, max_pieces: int = 6) -> str:
        return _summarize_in_chunks(text, self._generate, piece_words, max_pieces)


_summarizer: Summarizer | None = None


def get_summarizer() -> Summarizer:
    global _summarizer
    settings = get_settings()
    if not settings.ai_summary:
        raise SummarizerUnavailable("AI summarization is switched off (AI_SUMMARY=false)")
    if _summarizer is None:
        _summarizer = OllamaSummarizer(
            settings.summary_model,
            settings.summary_ollama_url,
            settings.summary_max_new_tokens,
            settings.summary_timeout_seconds,
        )
    return _summarizer


def summarize_with_fallback(text: str, max_sentences: int = 3) -> tuple[str, str, bool]:
    """Return an AI draft when available, otherwise the extractive summary."""
    if not text.strip():
        return "", SUMMARY_METHOD, False
    try:
        summarizer = get_summarizer()
        return summarizer.summarize(text), f"ai:{summarizer.name}", False
    except SummarizerUnavailable:
        return summarize_extractive(text, max_sentences), SUMMARY_METHOD, True


def set_summarizer(summarizer: Summarizer | None) -> None:
    """Swap the summarizer (tests use a stand-in). None restores the configured model."""
    global _summarizer
    _summarizer = summarizer
