@echo off
title Sentinel Enterprise Desktop App
echo Starting Sentinel Enterprise v2.0 Desktop Application...
cd /d "%~dp0\frontend"
start "" npx electron .
exit
