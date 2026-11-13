# Summarizer comparison

30 synthetic field reports with reference summaries. ROUGE F1, mean ± standard deviation over 5 held-out folds; AI models' beam width and length tuned on the training folds. Produced by `evaluate_summarizers.py`. This checked-in run predates the switch to TF-IDF sentence scoring; its word-frequency row is a historical baseline.

| Method | ROUGE-1 | ROUGE-2 | ROUGE-L | Parameters (M) | Seconds per report | Settings chosen (beams, max tokens) |
|---|---|---|---|---|---|---|
| Lead-2 (first two sentences) | 0.303 ± 0.016 | 0.048 ± 0.012 | 0.180 ± 0.006 | - | 0.003 | - |
| Word-frequency extractive (historical baseline) | 0.317 ± 0.039 | 0.061 ± 0.033 | 0.202 ± 0.033 | - | 0.003 | - |
| flan-t5-small | 0.227 ± 0.036 | 0.026 ± 0.015 | 0.133 ± 0.014 | 77 | 2.24 | 4, 60; 4, 60; 4, 60; 1, 60; 1, 60 |
| t5-small (summarization) | 0.300 ± 0.035 | 0.055 ± 0.023 | 0.193 ± 0.015 | 61 | 3.19 | 1, 90; 1, 90; 1, 90; 4, 90; 4, 90 |
| distilbart-cnn-6-6 | 0.339 ± 0.020 | 0.080 ± 0.020 | 0.217 ± 0.018 | 230 | 5.4 | 1, 90; 1, 60; 1, 60; 1, 60; 1, 60 |
| flan-t5-base | 0.232 ± 0.019 | 0.022 ± 0.007 | 0.139 ± 0.016 | 248 | 4.29 | 1, 60; 4, 60; 1, 60; 4, 60; 4, 60 |
