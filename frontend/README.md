# Frontend

The 3D globe site. It is a single static page with no build step.

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

| File | What it is |
|---|---|
| `index.html` | The whole site: styles, markup and script |
| `countries-110m.json` | Light country outlines, drawn while the globe moves |
| `countries-50m.json` | Detailed country outlines, drawn once the view is still and zoomed in |
| `img/` | Logo and project photographs (`img/full/` holds the 1920px copies for the full-screen viewer) |

On localhost the page loads projects from the API at http://localhost:8000 (see `../backend/inference/`). Without the API it uses the sample data built into the page.

To deploy on Vercel, set the project's Root Directory to `frontend` and the framework preset to Other.
