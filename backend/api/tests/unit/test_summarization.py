"""Summaries: the TF-IDF extractive summary, the Ollama summarizer and the fallback between them."""
import pytest

from app.ai.summarization import summarize
from app.text.normalize import split_sentences

EN = (
    "Lake Kivu sits on the border between Rwanda and the Democratic Republic of Congo. "
    "Fishing communities around Lake Kivu depend on the sambaza catch for food and income. "
    "The weather was pleasant on the day we arrived. "
    "Methane extraction and plastic pollution now threaten the fishing communities and the lake itself. "
    "A local guide recommended a restaurant. "
    "Researchers warn that fishing communities could lose their income if the lake keeps warming."
)


def test_summarize_english_keeps_order_and_drops_filler():
    summary = summarize(EN, max_sentences=3)
    sentences = split_sentences(summary)
    assert len(sentences) == 3
    assert "weather" not in summary and "restaurant" not in summary
    assert "fishing communities" in summary.lower()
    positions = [EN.index(s) for s in sentences]
    assert positions == sorted(positions)


def test_summarize_tfidf_prefers_distinctive_sentences():
    text = (
        "The community faces severe flooding across several villages. "
        "The community faces flooding in the villages. "
        "The community faces flooding near the villages. "
        "The community faces flooding beyond the villages."
    )
    assert summarize(text, max_sentences=1) == "The community faces severe flooding across several villages."


def test_summarize_short_and_empty_text():
    assert summarize("") == ""
    assert summarize("   \n ") == ""
    assert summarize("Just one sentence here.") == "Just one sentence here."
    assert summarize("First. Second.", max_sentences=5) == "First. Second."
    assert summarize(EN, max_sentences=0) == ""


def test_summarize_keeps_the_sentences_closest_to_the_whole_document():
    # TF-IDF vectors compared by cosine similarity: the off-topic sentence shares no words with the document's topic
    text = (
        "Herders in Mongolia lose their animals in a harsh winter. "
        "The harsh winter kills animals and leaves herders without income. "
        "A new phone was released in another country. "
        "Herders who lose their animals often move to the city."
    )
    summary = summarize(text, max_sentences=2)
    assert "phone" not in summary
    assert len(split_sentences(summary)) == 2


def test_summarize_does_not_glue_a_pdf_title_to_the_first_sentence():
    text = (
        "After the White Winter\n"
        "Field report · Arkhangai Province, Mongolia\n"
        "In Mongolia a dzud is a harsh winter. Herders lose animals. The families dig through snow to reach grass. "
        "Some move to the city for work. Others rebuild their herds slowly."
    )
    summary = summarize(text, max_sentences=3)
    assert "After the White Winter" not in summary and "Field report" not in summary
    assert summary.startswith("In Mongolia")


def test_summarize_notes_without_full_stops_still_get_a_summary():
    text = "- herders lose animals\n- hay arrives late\n- families move to the city\n- some rebuild herds"
    assert summarize(text, max_sentences=2) != ""


# ---------- the Ollama summarizer (no server needed: urlopen is replaced) ----------

def test_ollama_summarizer_posts_to_local_generate_api(monkeypatch):
    import json

    from app.ai.summarization import OllamaSummarizer

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return (
                b'{"response":"Here is a summary of the report in 3 concise sentences: '
                b'Lake Kivu is warming . Fishers report smaller catches."}'
            )

    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["method"] = request.method
        captured["body"] = json.loads(request.data)
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setattr("app.ai.summarization.abstractive.urlopen", fake_urlopen)
    summarizer = OllamaSummarizer("llama3.2:3b", "http://localhost:11434/", 75, 12)

    assert summarizer._generate("Lake Kivu is warming. Fishers report smaller catches.") == (
        "Lake Kivu is warming. Fishers report smaller catches."
    )
    assert captured == {
        "url": "http://localhost:11434/api/generate",
        "method": "POST",
        "body": {
            "model": "llama3.2:3b",
            "system": "Output only the summary sentences. Do not add a heading, introduction, or commentary.",
            "prompt": (
                "Summarize this report accurately in 2 or 3 concise sentences. "
                "Preserve its key people, places, issues, and findings. Use only facts in the report; "
                "do not add assumptions.\n\n"
                "REPORT:\nLake Kivu is warming. Fishers report smaller catches.\n\nSUMMARY:"
            ),
            "stream": False,
            "options": {"num_predict": 75, "temperature": 0.1},
        },
        "timeout": 12,
    }


def test_ollama_summarizer_falls_back_when_generation_is_truncated(monkeypatch):
    import json

    from app.ai.summarization import OllamaSummarizer, SummarizerUnavailable

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return json.dumps({
                "response": "A report summary cut off mid-sentence",
                "done_reason": "length",
            }).encode()

    monkeypatch.setattr("app.ai.summarization.abstractive.urlopen", lambda *_args, **_kwargs: Response())

    with pytest.raises(SummarizerUnavailable, match="reached the output token limit"):
        OllamaSummarizer("llama3.2:3b")._generate("A sample report.")


def test_ollama_summarizer_reports_unavailable_server(monkeypatch):
    from urllib.error import URLError

    from app.ai.summarization import OllamaSummarizer, SummarizerUnavailable

    def unavailable(*_args, **_kwargs):
        raise URLError("connection refused")

    monkeypatch.setattr("app.ai.summarization.abstractive.urlopen", unavailable)
    summarizer = OllamaSummarizer("llama3.2:3b")

    with pytest.raises(SummarizerUnavailable, match="Could not connect to Ollama"):
        summarizer._generate("A sample report.")


def test_get_summarizer_uses_configured_ollama(monkeypatch):
    from app.ai.summarization import OllamaSummarizer, get_summarizer, set_summarizer
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "summary_model", "llama-test:3b")
    monkeypatch.setattr(settings, "summary_ollama_url", "http://127.0.0.1:11434")
    set_summarizer(None)

    summarizer = get_summarizer()

    assert isinstance(summarizer, OllamaSummarizer)
    assert summarizer.name == "llama-test:3b"
    assert summarizer.base_url == "http://127.0.0.1:11434"


# ---------- summarize_with_fallback: AI draft when available, TF-IDF otherwise ----------

class StubSummarizer:
    name = "stub-model"

    def summarize(self, text):
        return "AI: " + text[:10]


class UnavailableSummarizer:
    name = "missing-model"

    def summarize(self, text):
        from app.ai.summarization import SummarizerUnavailable

        raise SummarizerUnavailable("model not downloaded")


def test_fallback_uses_the_model_when_it_works(monkeypatch):
    from app.ai.summarization import abstractive, summarize_with_fallback

    monkeypatch.setattr(abstractive, "_summarizer", StubSummarizer())
    summary, method, fallback = summarize_with_fallback(EN)
    assert summary == "AI: " + EN[:10] and method == "ai:stub-model" and fallback is False


def test_fallback_uses_tfidf_when_the_model_is_unavailable(monkeypatch):
    from app.ai.summarization import SUMMARY_METHOD, abstractive, summarize_with_fallback

    monkeypatch.setattr(abstractive, "_summarizer", UnavailableSummarizer())
    summary, method, fallback = summarize_with_fallback(EN, max_sentences=2)
    assert summary == summarize(EN, 2) and method == SUMMARY_METHOD and fallback is True


def test_fallback_uses_tfidf_when_ai_summaries_are_switched_off(monkeypatch):
    from app.ai.summarization import SUMMARY_METHOD, summarize_with_fallback
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "ai_summary", False)
    assert summarize_with_fallback(EN)[1:] == (SUMMARY_METHOD, True)


def test_fallback_with_empty_text_is_not_a_fallback():
    from app.ai.summarization import SUMMARY_METHOD, summarize_with_fallback

    assert summarize_with_fallback("   ") == ("", SUMMARY_METHOD, False)


def test_tfidf_summary_uses_a_repeated_sentence_once():
    repeated = "Ruben Soto, a migrant from Venezuela, rides a freight train north through Mexico."
    text = " ".join([repeated, "Many migrants ride the freight train because they cannot pay a smuggler.", repeated,
                     "The train crosses the desert near the border with the United States.",
                     "Some riders have fallen from the train and been injured."])
    summary = summarize(text, max_sentences=2)
    assert summary.count(repeated) == 1
    assert len(split_sentences(summary)) == 2
