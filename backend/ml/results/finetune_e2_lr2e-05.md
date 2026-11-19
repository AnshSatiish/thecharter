# Fine-tuning the embedding model

Base model `BAAI/bge-small-en-v1.5`, 2 epochs, learning rate 2e-05, batch 16, multiple-negatives ranking loss. 5-fold cross-validation over projects: each fold is fine-tuned without the held-out projects and tested on the queries about them. Ranking measured without a cut-off. Produced by `finetune_embeddings.py`.

| Model | Hit@1 | Recall@3 | MRR |
|---|---|---|---|
| Pretrained | 0.98 ± 0.03 | 1.00 ± 0.00 | 0.99 ± 0.02 |
| Fine-tuned | 0.92 ± 0.06 | 0.99 ± 0.02 | 0.95 ± 0.03 |

| Fold | Test queries | Training pairs | Minutes | MRR pretrained | MRR fine-tuned |
|---|---|---|---|---|---|
| 1 | 20 | 462 | 3.8 | 0.967 | 0.912 |
| 2 | 21 | 462 | 3.9 | 0.976 | 0.976 |
| 3 | 19 | 478 | 4.0 | 1.000 | 0.939 |
| 4 | 21 | 478 | 4.0 | 1.000 | 1.000 |
| 5 | 19 | 480 | 4.0 | 1.000 | 0.939 |
