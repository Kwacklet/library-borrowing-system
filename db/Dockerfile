# Database image: official PostgreSQL + our schema/seed script.
FROM postgres:16-alpine
# Scripts in this folder run automatically ONLY when the data volume is empty
COPY init.sql /docker-entrypoint-initdb.d/init.sql
