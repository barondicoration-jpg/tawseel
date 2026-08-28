#!/bin/sh
set -e

echo ">>> Installing front-end dependencies..."
cd front-end
npm install
npm approve-scripts esbuild 2>/dev/null || true
cd ..

echo ">>> Building front-end..."
npm run build --prefix front-end

echo ">>> Build complete."
