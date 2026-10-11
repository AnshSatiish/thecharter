# Search evaluation

Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`. Data: 7 sample projects, 27 queries (3 off-topic). Produced by `evaluate_search.py`.

With so few projects these numbers show that the pipeline works and how the modes differ; they are not a final measurement. The relevance cut-off (SEMANTIC_MIN_SCORE) was also tuned on these same projects, and the queries were written by the team. Rerun this, with queries from people outside the team, when the partner's projects are loaded.

| Queries | Mode | Hit@1 | Recall@3 | MRR |
|---|---|---|---|---|
| all (24) | keyword | 0.62 | 0.67 | 0.66 |
| all (24) | semantic | 1.00 | 1.00 | 1.00 |
| all (24) | hybrid | 1.00 | 1.00 | 1.00 |
| exact (8) | keyword | 1.00 | 1.00 | 1.00 |
| exact (8) | semantic | 1.00 | 1.00 | 1.00 |
| exact (8) | hybrid | 1.00 | 1.00 | 1.00 |
| paraphrase (10) | keyword | 0.60 | 0.70 | 0.68 |
| paraphrase (10) | semantic | 1.00 | 1.00 | 1.00 |
| paraphrase (10) | hybrid | 1.00 | 1.00 | 1.00 |
| spanish (6) | keyword | 0.17 | 0.17 | 0.17 |
| spanish (6) | semantic | 1.00 | 1.00 | 1.00 |
| spanish (6) | hybrid | 1.00 | 1.00 | 1.00 |

Off-topic queries that wrongly returned a result (out of 3): keyword 0, semantic 0, hybrid 0.

## Every query

| Type | Query | Relevant | Keyword | Semantic | Hybrid |
|---|---|---|---|---|---|
| exact | Lake Kivu | [23] | [23] | [23] | [23] |
| exact | Darién Gap | [27] | [27] | [27, 23] | [27, 23] |
| exact | Finance Bill 2024 | [25] | [25] | [25] | [25] |
| exact | cool burning | [28] | [28] | [28] | [28] |
| exact | high-speed train | [18] | [18] | [18, 26] | [18, 26] |
| exact | Day of the Dead | [17] | [17] | [17] | [17] |
| exact | Title 42 | [26] | [26] | [26] | [26] |
| exact | asylum seekers | [26] | [26] | [26, 27] | [26, 27] |
| paraphrase | people forced to leave their home country | [26, 27] | [17, 18, 26] | [27, 26] | [27, 26] |
| paraphrase | honouring ancestors who have passed away | [17] | [17] | [17] | [17] |
| paraphrase | young people demonstrating against the government | [25] | [25] | [25] | [25] |
| paraphrase | fishermen losing their income | [23] | [] | [23] | [23] |
| paraphrase | using fire to stop bigger bushfires | [28] | [28, 17, 26, 25] | [28] | [28] |
| paraphrase | rich and poor travelling differently | [18] | [] | [18, 26, 27] | [18, 26, 27] |
| paraphrase | dangerous journey through the rainforest | [27] | [27, 26] | [27] | [27] |
| paraphrase | families separated at the frontier | [26, 27] | [17, 27] | [27, 26, 17, 18] | [27, 26, 17, 18] |
| paraphrase | environmental damage to a lake | [23] | [23, 28] | [23] | [23] |
| paraphrase | traditional ecological knowledge of Aboriginal people | [28] | [28] | [28, 17] | [28, 17] |
| spanish | personas que huyen de su país | [26, 27] | [] | [27, 26] | [27, 26] |
| spanish | pescadores y cambio climático | [23] | [] | [23] | [23] |
| spanish | protestas de jóvenes contra los impuestos | [25] | [] | [25] | [25] |
| spanish | ritual para recordar a los muertos | [17] | [17] | [17] | [17] |
| spanish | trenes y desigualdad | [18] | [] | [18, 26] | [18, 26] |
| spanish | incendios forestales y conocimiento indígena | [28] | [] | [28] | [28] |
| off-topic | chocolate cake recipe | [] | [] | [] | [] |
| off-topic | quantum computing | [] | [] | [] | [] |
| off-topic | football transfer news | [] | [] | [] | [] |
