#!/bin/bash

echo "Starting quranbot with pnpm"

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "pnpm not found. Installing pnpm globally..."
    npm install -g pnpm
fi
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies with pnpm"
    pnpm install
fi


echo "Running bot with pnpm"
pnpm start
