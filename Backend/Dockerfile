# =============================================================================
# CRM AI Backend - Dockerfile (Multi-stage)
# =============================================================================
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copier uniquement le .csproj pour bénéficier du cache Docker
COPY src/CrmApi/CrmApi.csproj .
RUN dotnet restore

# Copier le reste du code source
COPY src/CrmApi/ .
RUN dotnet publish -c Release -o /app

# =============================================================================
# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Installer curl pour les healthchecks + Python/FFmpeg pour Whisper
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl python3 python3-venv ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Environnement Python isolé pour la transcription (faster-whisper)
RUN python3 -m venv /opt/whisper \
    && /opt/whisper/bin/pip install --no-cache-dir faster-whisper \
    && ln -sf /opt/whisper/bin/python /usr/local/bin/whisper-python

WORKDIR /app
COPY --from=build /app .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV Whisper__PythonPath=/opt/whisper/bin/python

ENTRYPOINT ["dotnet", "CrmApi.dll"]
