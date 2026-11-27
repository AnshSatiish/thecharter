# Search evaluation on the partner's real projects

9 partner projects (with the two thesis PDFs). 45 queries taken from the projects' own text and held out of the index: 9 descriptions and 36 photo captions, each cut to 200 characters. No generated data. Produced by `evaluate_search_real.py`.

## 1. The application as configured (BAAI/bge-small-en-v1.5, 40-word passages, cut-offs 0.575 and 0.95)

| Mode | Queries | Hit@1 | MRR | Returned nothing |
|---|---|---|---|---|
| keyword | all (45) | 0.91 | 0.95 | 0 |
| keyword | description (9) | 1.00 | 1.00 |  |
| keyword | caption (36) | 0.89 | 0.94 |  |
| semantic | all (45) | 0.93 | 0.97 | 0 |
| semantic | description (9) | 1.00 | 1.00 |  |
| semantic | caption (36) | 0.92 | 0.96 |  |
| hybrid | all (45) | 0.98 | 0.99 | 0 |
| hybrid | description (9) | 1.00 | 1.00 |  |
| hybrid | caption (36) | 0.97 | 0.99 |  |

## 2. Ranking quality without a cut-off

| Method | Queries | Hit@1 | Hit@3 | MRR |
|---|---|---|---|---|
| Keyword (full-text) | all (45) | 0.91 | 1.00 | 0.95 |
| Keyword (full-text) | description (9) | 1.00 | 1.00 | 1.00 |
| Keyword (full-text) | caption (36) | 0.89 | 1.00 | 0.94 |
| TF-IDF | all (45) | 0.98 | 1.00 | 0.99 |
| TF-IDF | description (9) | 1.00 | 1.00 | 1.00 |
| TF-IDF | caption (36) | 0.97 | 1.00 | 0.98 |
| all-MiniLM-L6-v2 | all (45) | 0.96 | 1.00 | 0.97 |
| all-MiniLM-L6-v2 | description (9) | 1.00 | 1.00 | 1.00 |
| all-MiniLM-L6-v2 | caption (36) | 0.94 | 1.00 | 0.97 |
| paraphrase-multilingual-MiniLM-L12-v2 | all (45) | 0.93 | 1.00 | 0.96 |
| paraphrase-multilingual-MiniLM-L12-v2 | description (9) | 1.00 | 1.00 | 1.00 |
| paraphrase-multilingual-MiniLM-L12-v2 | caption (36) | 0.92 | 1.00 | 0.95 |
| bge-small-en-v1.5 | all (45) | 0.93 | 1.00 | 0.97 |
| bge-small-en-v1.5 | description (9) | 1.00 | 1.00 | 1.00 |
| bge-small-en-v1.5 | caption (36) | 0.92 | 1.00 | 0.96 |

## Confusion matrix, hybrid search (rows: the project the query came from; columns: first result)

| From \ First | 17 | 18 | 23 | 25 | 26 | 27 | 28 | 29 | 30 | none |
|---|---|---|---|---|---|---|---|---|---|---|
| 17 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 23 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 25 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| 26 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 |
| 27 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| 28 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 1 | 0 |
| 29 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 |
