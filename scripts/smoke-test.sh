#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# smoke-test.sh — prove that the app builds, starts and serves from a clean
# clone. Requires only Docker; no Firebase or Gemini accounts needed.
#
# Usage:
#   ./scripts/smoke-test.sh
#
# Exit code:
#   0  – all checks passed
#   1  – one or more checks failed
# ---------------------------------------------------------------------------
set -euo pipefail

COMPOSE_PROJECT="ruralhealth-smoke"
IMAGE_TAG="ruralhealth-ai:smoke"

cleanup() {
    echo ">>> Tearing down..."
    docker compose -p "$COMPOSE_PROJECT" down -v --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT

echo ">>> Building the Docker stack (this may take a few minutes)..."
docker compose -p "$COMPOSE_PROJECT" up --build -d

echo ">>> Waiting for the health endpoint..."
for attempt in $(seq 1 30); do
    if curl -fsS http://localhost:8000/health >/dev/null 2>&1; then
        echo "    Health check passed on attempt $attempt"
        break
    fi
    if [ "$attempt" -eq 30 ]; then
        echo "FAIL: Health check never succeeded after 30 attempts."
        docker compose -p "$COMPOSE_PROJECT" logs web
        exit 1
    fi
    sleep 2
done

echo ">>> Verifying the frontend bundle is served..."
curl -fsS http://localhost:8000/ | grep -q '<!doctype html>' \
    || { echo "FAIL: Frontend bundle was not served."; exit 1; }
echo "    Frontend bundle OK"

echo ">>> Testing the registration API endpoint..."
REGISTER_RESPONSE=$(curl -fsS -X POST http://localhost:8000/api/auth/register \
    -H 'Content-Type: application/json' \
    -d '{"email":"smoke@example.com","full_name":"Smoke Test","password":"smoke-test-pass"}')

echo "$REGISTER_RESPONSE" | grep -q '"role"' \
    || { echo "FAIL: Registration did not return a role."; echo "$REGISTER_RESPONSE"; exit 1; }
echo "    Registration API OK"

echo ""
echo "========================================="
echo "  All smoke tests passed!"
echo "========================================="
