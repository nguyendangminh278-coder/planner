@echo off
setlocal
cd /d "%~dp0"
title Planner
where node >nul 2>&1
if errorlevel 1 (
  echo Planner needs Node.js 24. Install it from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Preparing Planner for the first run...
  call npm ci
  if errorlevel 1 (
    echo Could not install dependencies. Check your Internet connection and try again.
    pause
    exit /b 1
  )
)
echo Opening Planner in your browser. Keep this window open while using Planner.
call npm run start
pause
