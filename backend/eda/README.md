# Exploratory data analysis

Scripts that describe the data before any modelling.

`eda_sample_projects.py` analyses the 7 sample projects in `../data/samples/projects.json`: size and completeness, category and SDG balance, text lengths, languages, keywords, coverage, and how close the projects are to each other in meaning. It writes `eda_summary.json` and three figures in `figures/`.

```bash
..\.venv\Scripts\python eda_sample_projects.py
```

It needs matplotlib (`pip install matplotlib`) on top of the backend requirements. Rerun it when the partner's full dataset arrives; the numbers so far describe the sample only.
