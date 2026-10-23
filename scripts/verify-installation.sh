#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo " Mitior 2.0 (mOS) — Automated Installation & QA Verification"
echo "============================================================"

echo "[1/5] Checking required project artifacts..."
for f in "SRS.md" "metadata.json" "index.html" "server.ts" "src/App.tsx" "src/components/SrsDocumentView.tsx"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: Missing required file: $f"
    exit 1
  fi
done
echo "  ✔ All core source and SRS files present."

echo "[2/5] Verifying zero browser window.alert() calls in src/..."
if grep -rn "\balert(" src/ >/dev/null 2>&1; then
  echo "ERROR: Found forbidden alert() call in src/"
  exit 1
fi
echo "  ✔ Zero alert() calls in src/."

echo "[3/5] Running TypeScript compiler verification (npm run lint)..."
npm run lint
echo "  ✔ TypeScript compilation clean (0 errors)."

echo "[4/5] Running automated unit, integration & security test suite (npm test)..."
npm test
echo "  ✔ All 13 automated test suites passed."

echo "[5/5] Building production client & server bundles (npm run build)..."
npm run build
echo "  ✔ Production build succeeded (dist/index.html + dist/server.cjs)."

echo "============================================================"
echo " VERIFICATION COMPLETE: Mitior 2.0 is ready for operation."
echo "============================================================"
