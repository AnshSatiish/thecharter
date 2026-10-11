# PostgreSQL 16 with PostGIS (map queries) and pgvector (semantic search).
FROM postgis/postgis:16-3.4
# This image is built on Debian 11, whose PostgreSQL packages now live in the archive repository.
RUN sed -i 's|http://apt.postgresql.org/pub/repos/apt/\? bullseye-pgdg|http://apt-archive.postgresql.org/pub/repos/apt bullseye-pgdg-archive|' /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-pgvector \
    && rm -rf /var/lib/apt/lists/*
