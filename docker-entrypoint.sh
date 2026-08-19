#!/usr/bin/env bash
# Apply pending migrations before serving, so `docker compose up` on a clean
# volume produces a working application with no manual steps.
set -euo pipefail

echo "Applying database migrations..."
python manage.py migrate --noinput

# Bind here rather than in CMD so a platform-supplied PORT (Render, Fly) is
# honoured without the command having to be overridden.
if [ "$1" = "gunicorn" ]; then
    set -- "$@" --bind "0.0.0.0:${PORT:-8000}"
fi

echo "Starting: $*"
exec "$@"
