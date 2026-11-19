"""Routes anyone can call. `routers` is mounted under /api by app.main, in this order."""
from app.routes.public import ai, authors, documents, geo, projects, search

# search comes before projects: /projects/search must not be read as a project id.
routers = [search.router, projects.router, documents.router, authors.router, ai.router, geo.router]
