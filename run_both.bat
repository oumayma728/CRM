@echo off
title CRM AI - Launch System
echo [1/3] Starting Backend (.NET)...
start cmd /k "cd BackendDotNet\src\CrmApi && dotnet run --launch-profile http"
echo [2/3] Starting Frontend (React)...
start cmd /k "cd frontend && npm run dev"
echo [3/3] Checking Ollama...
echo Make sure Ollama is running (ollama run gemma3:4b)
echo.
echo ==========================================
echo CRM AI is starting...
echo Frontend : http://localhost:5173
echo Backend  : http://localhost:5190
echo Swagger  : http://localhost:5190/swagger
echo ==========================================
pause
