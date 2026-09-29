# =============================================================================
# CRM Backend - Dockerfile (multi-stage) — builds Backend/CRM.API.csproj
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first to benefit from the Docker layer cache
COPY CRM.API.csproj .
RUN dotnet restore CRM.API.csproj

COPY . .
RUN dotnet publish CRM.API.csproj -c Release -o /app --no-restore

# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# curl for health checks + Python/FFmpeg for local Whisper transcription
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl python3 python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Isolated Python environment for transcription (faster-whisper)
RUN python3 -m venv /opt/whisper \
    && /opt/whisper/bin/pip install --no-cache-dir faster-whisper

WORKDIR /app
COPY --from=build /app .
COPY scripts/transcribe.py ./scripts/transcribe.py

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV Whisper__PythonPath=/opt/whisper/bin/python
ENV Whisper__ScriptPath=scripts/transcribe.py

ENTRYPOINT ["dotnet", "CRM.API.dll"]
