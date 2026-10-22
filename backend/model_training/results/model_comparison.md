# Search model comparison

37 projects (7 partner samples, 30 synthetic), 122 queries (113 with an answer; types: exact 38, off-topic 9, paraphrase 70, topic 5). Every method's settings were tuned by 5-fold cross-validation over the queries; figures are the mean ± standard deviation over the five held-out folds. Produced by `compare_models.py`.

| Method | Hit@1 | Recall@3 | MRR | List F1 | Off-topic rejected | Size (MB) | Query (ms) |
|---|---|---|---|---|---|---|---|
| Keyword (full-text) | 0.89 ± 0.07 | 0.93 ± 0.02 | 0.93 ± 0.04 | 0.59 ± 0.06 | 0.50 ± 0.50 | 0 | 32.2 |
| TF-IDF | 0.90 ± 0.06 | 0.86 ± 0.07 | 0.90 ± 0.06 | 0.84 ± 0.05 | 0.60 ± 0.42 | 0 | - |
| all-MiniLM-L6-v2 | 0.89 ± 0.07 | 0.89 ± 0.08 | 0.91 ± 0.07 | 0.85 ± 0.05 | 0.70 ± 0.45 | 90 | 3.9 |
| Hybrid: keyword + all-MiniLM-L6-v2 | 0.90 ± 0.06 | 0.91 ± 0.07 | 0.93 ± 0.06 | 0.90 ± 0.06 | 1.00 ± 0.00 | 90 | 3.9 |
| paraphrase-multilingual-MiniLM-L12-v2 | 0.86 ± 0.03 | 0.86 ± 0.05 | 0.88 ± 0.04 | 0.83 ± 0.02 | 0.70 ± 0.45 | 235 | 10.8 |
| Hybrid: keyword + paraphrase-multilingual-MiniLM-L12-v2 | 0.91 ± 0.04 | 0.90 ± 0.06 | 0.93 ± 0.04 | 0.89 ± 0.04 | 0.90 ± 0.22 | 235 | 10.8 |
| bge-small-en-v1.5 | 0.95 ± 0.04 | 0.92 ± 0.06 | 0.96 ± 0.04 | 0.87 ± 0.04 | 0.80 ± 0.45 | 66 | 8.1 |
| Hybrid: keyword + bge-small-en-v1.5 | 0.94 ± 0.06 | 0.90 ± 0.07 | 0.94 ± 0.06 | 0.86 ± 0.03 | 0.80 ± 0.45 | 66 | 8.1 |

Hit@1 on held-out queries by kind of query:

| Method | exact (38) | paraphrase (70) | topic (5) |
|---|---|---|---|
| Keyword (full-text) | 1.00 | 0.86 | 0.60 |
| TF-IDF | 1.00 | 0.86 | 0.80 |
| all-MiniLM-L6-v2 | 0.95 | 0.86 | 0.80 |
| Hybrid: keyword + all-MiniLM-L6-v2 | 1.00 | 0.86 | 0.80 |
| paraphrase-multilingual-MiniLM-L12-v2 | 0.92 | 0.83 | 0.80 |
| Hybrid: keyword + paraphrase-multilingual-MiniLM-L12-v2 | 1.00 | 0.87 | 0.80 |
| bge-small-en-v1.5 | 0.97 | 0.93 | 1.00 |
| Hybrid: keyword + bge-small-en-v1.5 | 1.00 | 0.90 | 1.00 |

Settings (passage words, minimum similarity, relative cut) chosen in each fold, and on all queries (final):

- TF-IDF: 90, 0.025, 0.9; 90, 0.025, 0.9; 90, 0.025, 0.8; 90, 0.025, 0.9; 60, 0.025, 0.9 | final: 90, 0.025, 0.9
- all-MiniLM-L6-v2: 40, 0.425, 0.9; 90, 0.4, 0.9; 40, 0.25, 0.9; 40, 0.225, 0.9; 40, 0.25, 0.9 | final: 40, 0.25, 0.9
- Hybrid: keyword + all-MiniLM-L6-v2: 40, 0.425, 0.9; 40, 0.45, 0.9; 40, 0.425, 0.9; 40, 0.425, 0.9; 40, 0.425, 0.9 | final: 40, 0.425, 0.9
- paraphrase-multilingual-MiniLM-L12-v2: 40, 0.425, 0.9; 60, 0.275, 0.95; 60, 0.275, 0.95; 60, 0.225, 0.95; 40, 0.25, 0.95 | final: 60, 0.275, 0.95
- Hybrid: keyword + paraphrase-multilingual-MiniLM-L12-v2: 40, 0.425, 0.9; 40, 0.425, 0.95; 40, 0.425, 0.95; 40, 0.425, 0.95; 40, 0.375, 0.95 | final: 40, 0.425, 0.95
- bge-small-en-v1.5: 40, 0.575, 0.95; 40, 0.575, 0.95; 40, 0.575, 0.95; 60, 0.575, 0.95; 40, 0.525, 0.95 | final: 40, 0.575, 0.95
- Hybrid: keyword + bge-small-en-v1.5: 40, 0.625, 0.95; 40, 0.675, 0.95; 40, 0.575, 0.95; 60, 0.625, 0.95; 40, 0.525, 0.95 | final: 40, 0.575, 0.95
