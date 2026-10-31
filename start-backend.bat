@echo off
title EPOCH Spring Boot Backend (Port 8080)
echo ========================================================
echo Starting EPOCH Spring Boot Backend on http://localhost:8080
echo ========================================================
call gradlew.bat bootRun
pause
