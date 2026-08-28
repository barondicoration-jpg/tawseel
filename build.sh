#!/bin/sh
set -e
echo ">>> Installing front-end dependencies..."
npm install --prefix front-end --foreground-scripts
echo ">>> Building front-end..."
npm run build --prefix front-end
echo ">>> Build complete."
