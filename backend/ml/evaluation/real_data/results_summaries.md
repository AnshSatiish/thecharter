# Summarizers on the partner's real projects

9 documents: 7 photo projects (narration summarized, the author's description as reference) and 2 theses (the first 2100 words of the introduction summarized, the author's abstract as reference). ROUGE F1, mean ± standard deviation over the documents; fixed settings, nothing tuned. No generated data. Produced by `evaluate_summaries_real.py`.

| Method | ROUGE-1 | ROUGE-2 | ROUGE-L | ROUGE-L photo projects | ROUGE-L theses | Seconds per document |
|---|---|---|---|---|---|---|
| Lead-2 (first two sentences) | 0.248 ± 0.104 | 0.063 ± 0.060 | 0.175 ± 0.075 | 0.201 | 0.085 | 0.0 |
| TF-IDF + cosine (application fallback) | 0.235 ± 0.075 | 0.049 ± 0.046 | 0.160 ± 0.058 | 0.168 | 0.133 | 0.001 |
| distilbart-cnn-6-6 | 0.234 ± 0.070 | 0.065 ± 0.056 | 0.166 ± 0.059 | 0.188 | 0.090 | 9.95 |
| t5-small (summarization) | 0.243 ± 0.102 | 0.053 ± 0.054 | 0.142 ± 0.061 | 0.158 | 0.085 | 3.86 |
| flan-t5-small | 0.156 ± 0.094 | 0.025 ± 0.066 | 0.112 ± 0.066 | 0.133 | 0.041 | 1.86 |
| flan-t5-base | 0.230 ± 0.142 | 0.066 ± 0.084 | 0.168 ± 0.116 | 0.208 | 0.029 | 4.81 |
