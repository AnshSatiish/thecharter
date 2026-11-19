"""One search result, before it is joined with its project for the response."""
from dataclasses import dataclass, field


@dataclass
class Hit:
    project_id: int
    score: float
    matched_by: list[str] = field(default_factory=list)
    similarity: float | None = None       # cosine similarity of the best passage, semantic only
    passage: str | None = None            # the passage that matched by meaning
    passage_source: str | None = None     # "project" or "document"
    document_id: int | None = None
