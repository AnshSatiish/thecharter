"""Project summaries: a local Ollama model (abstractive.py) with a TF-IDF fallback (extractive.py)."""
from app.ai.summarization.abstractive import (
    OllamaSummarizer,
    Summarizer,
    SummarizerUnavailable,
    get_summarizer,
    set_summarizer,
    summarize_with_fallback,
)
from app.ai.summarization.extractive import SUMMARY_METHOD, summarize

__all__ = [
    "SUMMARY_METHOD",
    "OllamaSummarizer",
    "Summarizer",
    "SummarizerUnavailable",
    "get_summarizer",
    "set_summarizer",
    "summarize",
    "summarize_with_fallback",
]
