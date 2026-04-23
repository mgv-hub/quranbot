@echo off
title quranbot Starter - pnpm
echo ==============================================
echo Starting quranbot with pnpm...
echo ==============================================

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js first
    pause
    exit /b
)

pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo pnpm not found. Installing pnpm globally...
    npm install -g pnpm
)

if not exist node_modules (
    echo Installing dependencies with pnpm...
    pnpm install
)

echo Running bot with pnpm...
pnpm start

echo ==============================================
echo Press any key to exit...
pause >nul