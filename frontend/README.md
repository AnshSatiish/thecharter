# Frontend

The 3D globe site. Plain HTML, CSS and JavaScript: no build step, no framework, no npm install.

```bash
python -m http.server 8080      # from frontend/
```

Then open http://localhost:8080. On localhost the page loads projects from the API at http://localhost:8000 (see `../backend/api/`). Without the API it loads uploaded projects from Supabase (`config.js`) and shows them alongside the built-in sample data; without either, the sample data alone.

## Layout

```
frontend/
├── index.html          Markup only. Loads css/ in order, then js/ in order
├── config.js           Supabase URL and public anon key (row-level security decides what it may do)
├── vercel.json         Deployment: no build, cache headers for assets/ and data/
├── css/                One file per part of the page, loaded in this order
│   ├── base.css            colours, type, browser-drawn parts
│   ├── layout.css          header and map stage
│   ├── panels.css          filters, SDG chips, tools, preview card, results drawer
│   ├── project-view.css    project page, photo viewer
│   ├── search.css          search by meaning
│   ├── admin.css           upload form
│   ├── auth.css            sign-in gate
│   ├── pages.css           New entries, Community, Events, Sponsors
│   ├── profile.css         field passport
│   ├── coordinates.css     lat/lng readout, picking a location
│   └── touch.css           44px touch targets
├── js/
│   ├── api/
│   │   ├── client.js           which backend to use (FastAPI on localhost, otherwise Supabase)
│   │   └── loaders.js          load projects, with fallbacks
│   ├── data/sample-projects.js built-in fallback data
│   ├── state.js                categories, SDGs, helpers, shared `state`
│   ├── globe/                  render.js, places.js, pins.js, coordinates.js, interaction.js
│   ├── features/
│   │   ├── search.js           keyword ranking, backend search calls
│   │   ├── semantic-search.js  search by meaning in the browser
│   │   ├── filters.js          filter panel
│   │   ├── navigation.js       map tools, header navigation
│   │   ├── pin-card.js         preview card
│   │   ├── results.js          results drawer, refresh()
│   │   ├── project-view.js     project page, photo viewer
│   │   ├── pages.js            section pages
│   │   ├── profile.js          field passport
│   │   ├── auth.js             sign-in gate, route on the globe
│   │   └── admin/              upload.js, publish-supabase.js, location.js
│   └── main.js                 animation loop and start-up (always last)
├── data/               cities.json, countries-110m.json (light, while moving), countries-50m.json (detailed)
└── assets/
    ├── logo/
    ├── projects/thumbs/    sample project photos;  projects/full/  1920px copies for the photo viewer
    └── pdfs/               sample project PDFs
```

## How the scripts fit together

The JavaScript files are ordinary `<script>` tags, not ES modules. They share one global scope, exactly as the single inline script they were split from did, so a function in `globe/pins.js` can call `refresh()` from `features/results.js`.

The rule that keeps this working: **code that runs while a file loads may only use names from files loaded before it.** Code inside functions and event handlers runs later, after every file has loaded, so it can use anything. That is why `main.js`, which starts everything, is loaded last. If you add a file, add its `<script>` tag in `index.html` in the right place.

Converting to ES modules (`import`/`export`) is a possible later step; it needs every shared name exported and imported explicitly.

## Deploy

On Vercel, set the project's Root Directory to `frontend` and the framework preset to Other.
