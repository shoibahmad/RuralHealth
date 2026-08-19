# Stage 1: Build the frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy manifests first so the install layer is reused when only source changes.
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Vite inlines these at build time, so they have to be present now rather than
# at runtime. All are public Firebase client identifiers, not secrets.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID

RUN npm run build

# Stage 2: Build the backend and serve the application
# Matches the Python version the CI matrix tests against.
FROM python:3.14-slim

# libpq-dev and gcc are needed to build psycopg2 against PostgreSQL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Install from the lockfile so the image matches what CI tested, rather than
# re-resolving the ranges in requirements.txt at build time.
COPY backend/requirements.lock.txt ./
RUN pip install --no-cache-dir -r requirements.lock.txt

COPY backend/ ./

# Django serves the built SPA from here.
RUN mkdir -p /app/backend/static
COPY --from=frontend-builder /app/frontend/dist/ /app/backend/static/

# A build-time placeholder: the real key is supplied at runtime, but
# collectstatic refuses to run without one set.
RUN SECRET_KEY=build-time-placeholder python manage.py collectstatic --noinput

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as a non-root user.
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/health" || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["gunicorn", "ruralhealth.wsgi:application", "--workers", "3"]
