# Fine-tuning the embedding model

Base model `BAAI/bge-small-en-v1.5`, 1 epochs, learning rate 5e-06, batch 16, multiple-negatives ranking loss. 5-fold cross-validation over projects: each fold is fine-tuned without the held-out projects and tested on the queries about them. Ranking measured without a cut-off. Produced by `finetune_embeddings.py`.

| Model | Hit@1 | Recall@3 | MRR |
|---|---|---|---|
| Pretrained | 0.98 ± 0.03 | 1.00 ± 0.00 | 0.99 ± 0.02 |
| Fine-tuned | 0.96 ± 0.05 | 1.00 ± 0.00 | 0.98 ± 0.03 |

| Fold | Test queries | Training pairs | Minutes | MRR pretrained | MRR fine-tuned |
|---|---|---|---|---|---|
| 1 | 20 | 462 | 2.1 | 0.967 | 0.942 |
| 2 | 21 | 462 | 1.9 | 0.976 | 0.952 |
| 3 | 19 | 478 | 2.0 | 1.000 | 1.000 |
| 4 | 21 | 478 | 2.0 | 1.000 | 1.000 |
| 5 | 19 | 480 | 2.0 | 1.000 | 1.000 |
