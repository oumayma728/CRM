# CRM AI Project

Application de gestion de la relation client (CRM) avec intelligence artificielle pour l'analyse des appels, le scoring et le suivi des performances.

> Branche `final` : fusion de `main`, `integration/khaled-dev-v3` / `dev`, `feature/khaled(1)` et `feature/zied1`
> dans la structure de `main` avec le design de khaled-dev-v3 — voir **[MERGE_NOTES.md](MERGE_NOTES.md)**.

## Structure

```
Backend/                 API ASP.NET Core 8 (CRM.API.csproj)
  Controllers/ Services/<Module>/ Entities/ DTOs/<Module>/ Data/ Helpers/ Migrations/
  scripts/sql/           scripts SQL (schéma module IA, comptes de test…)
  tests/CRM.API.Tests/   tests xunit (unitaires + API)
frontend/                React 18 + Vite + Tailwind (design khaled-dev-v3)
  src/app/pages/<espace> admin, agent, quality, confirmation, commercial, technique, shared
  e2e/                   tests Playwright
```

Rôles : Super Admin, Admin, Agent, Qualité, Confirmatrice 1 / 2 / Client, Commercial, Service technique —
chacun a son menu et sa page d'accueil.

## Développement local

```bash
# Base de données (PostgreSQL 16) — schéma généré depuis le modèle EF + un compte par rôle (mot de passe Test1234!)
cd Backend
dotnet tool install --global dotnet-ef --version 8.0.11
dotnet ef dbcontext script -o /tmp/schema.sql
psql -U postgres -d crm_db -f /tmp/schema.sql
psql -U postgres -d crm_db -f scripts/sql/seed_e2e_users.sql

# API : http://localhost:5241 (swagger en Development)
ConnectionStrings__DefaultConnection="Host=localhost;Database=crm_db;Username=postgres;Password=..." dotnet run

# Frontend : http://localhost:5173 (proxy /api, /ws, /hubs → :5241)
cd ../frontend && npm ci && npm run dev
```

Tests : `dotnet test Backend/tests/CRM.API.Tests` · `cd frontend && npx vitest run` · `npx playwright test` (stack démarrée).

IA : `Groq__ApiKey` (chatbot, transcription et analyse cloud) et/ou Ollama local (`Ollama__BaseUrl`, modèle `gemma3:4b`)
et Whisper local (`Whisper__*`, `scripts/transcribe.py`).

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Frontend   │────▶│   Backend    │────▶│ PostgreSQL │
│  (Nginx)    │     │  (.NET 8)    │     │  (Port 5432)│
│  Port 80/443│     │  Port 5000   │     └────────────┘
└─────────────┘     └──────────────┘
       │                    │
       │              ┌─────┴──────┐
       │              │  WebSocket │
       │              │  /ws/      │
       │              └────────────┘
       │
  ┌────┴─────┐
  │ Uptime   │
  │ Kuma     │
  │ Port 3001│
  └──────────┘
```

## Prérequis

- **Docker** 24+ et **Docker Compose** v2
- **Git** (pour les mises à jour)
- **Domaine** (optionnel, pour HTTPS)
- **Ubuntu 22.04+** ou **Debian 12+** (recommandé)

## Installation

### 1. Cloner le projet

```bash
git clone <votre-repo> /opt/crm
cd /opt/crm
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
nano .env
```

Variables requises :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `JWT_SECRET` | Clé secrète JWT (min 32 car.) | — |
| `DB_PASSWORD` | Mot de passe PostgreSQL | — |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_NAME` | Nom de la base | `pfe_crm_ia` |

Générer une clé JWT sécurisée :
```bash
openssl rand -base64 64
```

### 3. Lancer le déploiement

```bash
chmod +x deploy.sh
./deploy.sh
```

## Variables d'environnement

Fichier : `.env`

| Variable | Requis | Défaut | Description |
|----------|--------|--------|-------------|
| `JWT_SECRET` | Oui | — | Clé secrète JWT (min 32 caractères) |
| `JWT_ISSUER` | Non | `CrmApi` | Émetteur du token JWT |
| `JWT_AUDIENCE` | Non | `CrmApp` | Audience du token JWT |
| `DB_NAME` | Non | `pfe_crm_ia` | Nom de la base PostgreSQL |
| `DB_USER` | Non | `postgres` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Oui | — | Mot de passe PostgreSQL |
| `PORT` | Non | `80` | Port d'écoute du frontend |
| `OLLAMA_URL` | Non | — | URL du service Ollama (optionnel) |

## Déploiement

### Production

```bash
# Déploiement complet
./deploy.sh

# Vérification
curl http://localhost/api/health
# Réponse : {"status":"healthy","database":"connected",...}
```

### Avec monitoring

Le monitoring (Uptime Kuma) est désactivé par défaut. Pour l'activer :

```bash
docker compose --profile monitoring up -d
```

Accès : `http://<ip>:3001`

### HTTPS (avec domaine)

```bash
# 1. Modifier le domaine dans frontend/nginx.ssl.conf
#    Remplacer "example.com" par votre domaine

# 2. Générer les certificats
sudo ./setup-ssl.sh votre-domaine.com

# 3. Déployer avec la configuration SSL
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Mise à jour

```bash
# Récupérer les dernières modifications
git pull

# Re-déployer
./deploy.sh
```

## Sauvegarde

### Manuel

```bash
# Sauvegarde complète (format .dump + .sql.gz)
./backup.sh

# Sauvegarde dans un répertoire spécifique
./backup.sh 60  # Rétention : 60 jours
```

### Automatisation (cron)

```bash
sudo crontab -e

# Backup quotidien à 3h du matin, rétention 30 jours
0 3 * * * /opt/crm/backup.sh 30 >> /var/log/crm-backup.log 2>&1
```

Les sauvegardes sont stockées dans `backups/` :
- `*.dump` — Format custom PostgreSQL (restauration rapide)
- `*.sql.gz` — Format SQL compressé (portable)

## Restauration

```bash
# Lister les sauvegardes disponibles
ls -lh backups/

# Restaurer la dernière sauvegarde
./restore.sh backups/pfe_crm_ia_20260712_030000.dump
```

## Dépannage

### Commandes de diagnostic (Étape 10)

```bash
# État des services
docker compose ps -a

# Logs en temps réel
docker compose logs -f

# Logs d'un service spécifique
docker compose logs backend --tail=100
docker compose logs frontend --tail=100
docker compose logs postgres --tail=100

# Consommation des ressources
docker stats

# Espace disque des conteneurs
docker system df

# Nettoyage
docker system prune -f        # Supprime les conteneurs arrêtés et images dangling
docker system prune -a -f     # Supprime TOUTES les images non utilisées
```

### Problèmes courants

#### Les conteneurs ne démarrent pas
```bash
docker compose logs --tail=50
```

#### Le backend est unhealthy
```bash
# Vérifier que PostgreSQL est healthy
docker compose ps postgres

# Tester la connexion à la base
docker exec crm-postgres pg_isready -U postgres -d pfe_crm_ia

# Vérifier les logs du backend
docker compose logs backend --tail=50
```

#### Le frontend est unhealthy
```bash
# Vérifier que nginx répond
docker exec crm-frontend wget -q -O /dev/null http://127.0.0.1:80/

# Vérifier les logs nginx
docker compose logs frontend --tail=50
```

#### Port déjà utilisé
```bash
# Vérifier ce qui écoute sur le port 80
sudo netstat -tlnp | grep :80

# Modifier le port dans .env
PORT=8080
```

#### Erreur "Connection refused" pour PostgreSQL
```bash
# Vérifier que le backend utilise le bon hostname
# La variable doit être : Host=postgres; (pas localhost)
docker compose config | grep ConnectionStrings
```

## Firewall (UFW)

```bash
# Installer et configurer
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

# Vérifier
sudo ufw status verbose
```

Ports exposés :
| Port | Service | Accès |
|------|---------|-------|
| `80` | Frontend HTTP | Internet |
| `443` | Frontend HTTPS | Internet |
| `22` | SSH | Administrateur |
| `5000` | Backend | Docker interne uniquement |
| `5432` | PostgreSQL | Docker interne uniquement |
| `3001` | Uptime Kuma | Docker interne uniquement |

## Références

- [Docker Compose](https://docs.docker.com/compose/)
- [.NET 8](https://learn.microsoft.com/dotnet/core/docker/)
- [Nginx](https://nginx.org/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
