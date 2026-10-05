# Pre-processing

Code that cleans and prepares data for the models: text clean-up, PDF text extraction, image resizing, train/test splits.

Nothing here yet. One piece of pre-processing already exists inside the API because uploads need it immediately: `../inference/app/services/text.py` extracts text from uploaded PDFs with pypdf. When the training pipeline is built, shared preparation steps belong here so training and the API use the same code.
