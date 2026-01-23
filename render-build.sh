#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "Installing Frontend dependencies..."
cd frontend
npm install

echo "Building Frontend..."
npm run build
cd ..

echo "Moving Frontend build to Backend static folder..."
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "Build successful!"
