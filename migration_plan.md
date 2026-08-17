# PLAN DE MIGRATION — CRM AI → CRM Équipe (feature/khaled)

---

## Contexte

Les deux projets partagent la **même stack technique** (.NET 8 + PostgreSQL + React 18 + Vite + Tailwind).  
La cible est la branche `feature/khaled` du repo `oumayma728/CRM`.  
Il ne s'agit **pas** d'une réécriture complète mais d'un **alignement structurel** + **merge de fonctionnalités**.

**Principe :** KEEP = garder tel quel, MODIFY = modifier dans le projet actuel, MIGRATE = ajouter depuis feature/khaled, MERGE = fusionner les deux, REMOVE = supprimer.

---

## PHASE 1 — Dossiers manquants à créer

| Dossier | Fichiers | Action | Priorité |
|---------|----------|--------|----------|
| `BackendDotNet/src/CrmApi/Authorization/` | `Permissions.cs`, `PermissionAuthorizationHandler.cs`, `RequirePermissionAttribute.cs` | **MIGRATE** depuis feature/khaled | P1 |
| `BackendDotNet/src/CrmApi/Middleware/` | `ExceptionMiddleware.cs` | **MIGRATE** depuis feature/khaled | P1 |
| `BackendDotNet/src/CrmApi/Repositories/` | `IRepository.cs`, `Repository.cs`, `IUnitOfWork.cs`, `UnitOfWork.cs` | **MIGRATE** depuis feature/khaled | P1 |
| `BackendDotNet/src/CrmApi/Validators/` | 9 fichiers FluentValidation (Ai, Alert, Appointment, Attendance, Auth, Call, Message, Quality, Salary) | **MIGRATE** depuis feature/khaled | P2 |

### Intégration avec l'existant
- `Helpers/PermissionFilter.cs` : **MERGE** avec `Authorization/RequirePermissionAttribute.cs` — conserver le filtre global existant, ajouter le support des permissions par attribut.
- Les Middleware `ExceptionMiddleware.cs` coexistera avec les éventuels middlewares existants.

---

## PHASE 2 — Nouvelles entités à ajouter

### Modèles (Models/)

| Entité | Fichiers dans feature/khaled | Action |
|--------|------------------------------|--------|
| Alert | `Alert.cs`, `AlertDto.cs`, `AlertService.cs`, `IAlertService.cs` | **MIGRATE** |
| Agent | `Agent.cs`, `AgentDto.cs`, `AgentService.cs`, `IAgentService.cs` | **MIGRATE** |
| Ai | `AiAnalysis.cs`, `AiDto.cs`, `AiService.cs`, `IAiService.cs` | **MIGRATE** |
| Call | `Call.cs`, `CallDto.cs`, `CallService.cs`, `ICallService.cs` | **MIGRATE** |
| Quality | `Quality.cs`, `QualityDto.cs`, `QualityService.cs`, `IQualityService.cs` | **MIGRATE** |
| Salary | `Salary.cs`, `SalaryDto.cs`, `SalaryService.cs`, `ISalaryService.cs` | **MIGRATE** |
| Attendance | `Attendance.cs`, `AttendanceDto.cs`, `AttendanceService.cs`, `IAttendanceService.cs` | **MIGRATE** |
| Appointment | (déjà présent — comparer et enrichir) | **MERGE** |
| Campaign | (peut-être déjà présent) | **MERGE** si existant, **MIGRATE** sinon |
| Lead | (déjà présent — comparer) | **MERGE** |
| Message | (déjà présent — comparer) | **MERGE** |
| Auth | `AuthDto.cs`, `AuthService.cs`, `IAuthService.cs` | **MERGE** avec l'existant |
| Followup | (vérifier si présent) | **MIGRATE** si nouveau |
| Supplier | (vérifier si présent) | **MIGRATE** si nouveau |

### DTOs (DTOs/)

Créer les sous-dossiers supplémentaires dans `DTOs/` :
```
DTOs/Agent/
DTOs/Ai/
DTOs/Alert/
DTOs/Analysis/
DTOs/Appointment/
DTOs/Attendance/
DTOs/Auth/
DTOs/Call/
DTOs/Campaign/
DTOs/Common/
DTOs/Lead/
DTOs/Message/
DTOs/Quality/
DTOs/Salary/
DTOs/Supplier/
```

---

## PHASE 3 — Services & Contrôleurs

### Réorganisation des Services

`feature/khaled` organise les Services en sous-dossiers par domaine :
```
Services/Agent/
Services/Ai/
Services/Analytics/
Services/Appointment/
Services/Attendance/
Services/Auth/
Services/Call/
Services/Campaign/
Services/Chat/
Services/Followup/
Services/Lead/
Services/Message/
Services/Quality/
Services/Salary/
Services/WebSocket/
```

**Action : MODIFY** — Restructurer les services existants dans cette arborescence sans changer le comportement.

### Fichier supplémentaire
- `Services/InactivityAlertService.cs` : **MIGRATE** depuis feature/khaled.

### Contrôleurs
Vérifier si `feature/khaled` a des contrôleurs supplémentaires ou des endpoints manquants. Ajouter les contrôleurs pour les nouvelles entités (AlertController, AgentController, CallController, QualityController, SalaryController…).

---

## PHASE 4 — Identifiants (int vs Guid)

| Projet | Type d'ID |
|--------|-----------|
| Projet actuel | `Guid` (majoritairement) |
| feature/khaled | `int` (partout) |

**Décision requise :** Conserver `Guid` ou migrer vers `int` ?

Options :
1. **Conserver Guid** — Pas de migration de données nécessaire. Les nouveaux modèles importés devront utiliser `Guid` au lieu de `int`. 
2. **Migrer vers int** — Cohérence avec feature/khaled. Nécessite une migration DB complète.
3. **Mixte** — Guid pour les entités existantes, int pour les nouvelles (déconseillé).

**Recommandation :** Conserver `Guid` (option 1) pour éviter une migration DB risquée. Adapter les nouveaux modèles importés.

---

## PHASE 5 — Frontend

### Analyse des différences

| Aspect | Projet actuel | feature/khaled | Action |
|--------|---------------|----------------|--------|
| Stack | React 18 + Vite 5 + Tailwind 3 | React 18 + Vite + Tailwind | **KEEP** |
| API client | `api.ts` avec fetch | Similaire | **MERGE** — enrichir avec les nouveaux endpoints |
| Pages | admin/, agent/, qualite/ | Probablement similaires | **COMPARE** |
| Composants | shadcn/ui + Framer Motion + Recharts | Idem supposé | **KEEP** |
| Auth | AuthContext with JWT | Similaire supposé | **MERGE** |

Ajouter les nouvelles pages pour les modules importés (Calls, Alerts, Salary, Quality, etc.).

---

## PHASE 6 — Base de données

### Nouvelles tables à ajouter (si modèles inédits)
- Alert
- Agent (si séparé de User)
- Call (vérifier si déjà présent)
- Quality
- Salary
- Attendance (compléter si partiel)
- Followup
- Supplier

### Migration
- Créer les migrations EF Core pour les nouvelles tables
- Pas de changement de schéma pour les tables existantes (sauf si int ↔ Guid)

---

## PHASE 7 — Ordre d'exécution

```
Phase 1 : Dossiers manquants
├── Étape 1 : Créer Authorization/ (3 fichiers depuis feature/khaled)
│   └── Fusionner Helpers/PermissionFilter.cs avec le nouveau système
├── Étape 2 : Créer Middleware/ExceptionMiddleware.cs
├── Étape 3 : Créer Repositories/ (IRepository, Repository, IUnitOfWork, UnitOfWork)
├── Étape 4 : Créer Validators/ (9 fichiers)
└── Vérifier que le build passe

Phase 2 : Nouvelles entités
├── Étape 1 : Ajouter les modèles (Alert, Agent, Call, Quality, Salary, etc.)
├── Étape 2 : Ajouter les DTOs correspondants
├── Étape 3 : Ajouter les services + interfaces
├── Étape 4 : Ajouter les contrôleurs
├── Étape 5 : Ajouter les validators FluentValidation
├── Étape 6 : Ajouter les profils AutoMapper
├── Étape 7 : Créer les migrations EF Core
└── Vérifier que le build passe

Phase 3 : Réorganisation des Services
├── Étape 1 : Créer les sous-dossiers par domaine
├── Étape 2 : Déplacer les services existants
├── Étape 3 : Mettre à jour les espaces de noms (namespaces)
├── Étape 4 : Ajouter InactivityAlertService.cs
└── Vérifier que le build passe

Phase 4 : Frontend
├── Étape 1 : Ajouter les nouveaux appels API dans api.ts
├── Étape 2 : Créer les pages pour les nouveaux modules
├── Étape 3 : Ajouter les composants si nécessaire
└── Vérifier que le build passe

Phase 5 : Tests
├── Tester tous les endpoints
├── Vérifier l'authentification et les permissions
└── Valider les données en base
```

---

## RÉSUMÉ

- **Stack inchangée** : .NET 8 / PostgreSQL / React 18 / Vite / Tailwind
- **Pas de réécriture** : le plan est un alignement + ajout de fonctionnalités
- **4 dossiers** à créer : Authorization, Middleware, Repositories, Validators
- **~8 nouvelles entités** à ajouter : Alert, Agent, Call, Quality, Salary, Followup, Supplier, etc.
- **Idéalement conserver Guid** pour éviter une migration DB risquée
- **Effort estimé** : 2-3 semaines
