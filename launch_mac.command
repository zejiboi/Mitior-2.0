#!/bin/bash
clear
cd "$(dirname "$0")"

echo "======================================================================="
echo "         MITIOR OS - SYSTEM SUITE DESKTOP LAUNCHER (MAC)"
echo "======================================================================="
echo ""
echo "[1/3] Verifying runtime dependencies..."

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo ""
    echo "❌ Node.js is NOT installed on this computer."
    echo ""
    echo "To run this application locally:"
    echo "1. Download and run the Node.js installer: https://nodejs.org/"
    echo "2. Double-click this launcher again."
    echo ""
    echo "Opening Node.js download page..."
    open "https://nodejs.org/"
    exit
fi

echo "✅ Node.js runtime detected."

# Check and install node_modules
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[2/3] Installing dependencies (this only happens on the first run)..."
    npm install
else
    echo "✅ Local dependencies already present."
fi

# Build production assets if missing
if [ ! -d "dist" ]; then
    echo ""
    echo "[3/3] Building native production assets..."
    npm run build
fi

echo ""
echo "======================================================================="
echo "    🎉 SUCCESS: Mitior OS is launching on http://localhost:3000!"
echo "======================================================================="
echo ""

# Open local web app in browser
open "http://localhost:3000"

# Preview the local server
npm run start
