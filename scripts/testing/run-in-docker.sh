#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE_TAG="acf-test:latest"
DOCKERFILE="${PROJECT_ROOT}/deployment/docker/Dockerfile.test"

echo "[docker-test] Building image ${IMAGE_TAG}..."
docker build -f "$DOCKERFILE" -t "$IMAGE_TAG" "$PROJECT_ROOT"

echo "[docker-test] Running CLI tests (default CMD)..."
docker run --rm \
  -e ACF_SKIP_POSTINSTALL=0 \
  -e ACF_SKIP_PLAYWRIGHT=1 \
  "$IMAGE_TAG"

echo "[docker-test] Running MCP tests..."
docker run --rm \
  -e ACF_SKIP_POSTINSTALL=0 \
  -e ACF_SKIP_PLAYWRIGHT=1 \
  "$IMAGE_TAG" npm test

echo "[docker-test] Running coverage for both suites..."
docker run --rm \
  -e ACF_SKIP_POSTINSTALL=0 \
  -e ACF_SKIP_PLAYWRIGHT=1 \
  "$IMAGE_TAG" npm run coverage:all || true

echo "[docker-test] Done."

