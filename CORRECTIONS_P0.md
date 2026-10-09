# Corrections P0 : ce qui a été changé, pourquoi, et ce qu'il faut en retenir

Document d'apprentissage. Pour chaque correction : **le problème** (en mots simples), **pourquoi c'est dangereux**,
**ce qui a été changé** (fichiers + extraits avant/après), **comment c'est vérifié**, **la leçon à retenir**.

> Aucun commit n'a été fait : tout est dans ton dossier de travail (`git status` pour voir les fichiers).
> Relis les changements avec `git diff`, puis commite par étapes (une correction = un commit).

---

## 0. Le résumé en 10 lignes

| | Avant | Après |
|---|---|---|
| Pages/actions accessibles **sans connexion** | 26 (contacts, agents + salaires, import de leads, création d'agents, messagerie…) | **0** (toutes répondent 401) |
| Page qui créait un admin avec le mot de passe `role123` | `InitController` (ouverte à tous) | **supprimée** |
| Un admin peut devenir super admin | oui (changer son mot de passe, puis se connecter) | **403** |
| Premier déploiement sur une base vide | erreur 500 partout, aucun moyen propre de créer un admin | **0 → 52 tables créées toutes seules + premier super admin** |
| Import de fichiers sur une installation neuve | bloqué (4 causes) | **fonctionne** : 49 800 contacts valides sur 50 000 lignes |
| Import « Technique » | affichait « succès » mais **ne créait aucun contact** | crée les vrais contacts, compte les erreurs et doublons |
| Liste des contacts | 41 Mo, tout le tableau, ouverte à tous | **50 lignes (11 Ko)**, 200 max, avec recherche côté serveur |
| Salaires | visibles par l'admin (page, export, listes) | **super admin seulement** (+ l'agent pour lui-même) |
| Tests automatiques | 100 | **216**, tous verts |

---

## 1. Les règles d'accès (celles que tu as demandées)

| Rôle | Règle |
|---|---|
| **Super admin** | accès à **tout** |
| **Admin** | accès à tout **sauf** les **salaires** et les **permissions** |
| Agent / Confirmatrices / Commercial / Technique / Qualité | uniquement leur espace de travail |
| Personne n'est connecté | rien (401) |

Où c'est appliqué (plusieurs couches, volontairement) :

1. **Le serveur** (le plus important, c'est la vraie protection) : `AdminAccessHandler`, `Permissions.cs`, `SalaryController`.
2. **Le menu** (`Sidebar.tsx`) : l'admin ne voit plus « Salaires » ni « Permissions ».
3. **Les routes de l'application** (`App.tsx`) : taper `/admin/salaries` à la main renvoie l'admin sur l'accueil.

> Règle d'or : **cacher un bouton ne protège rien**. Seul le serveur protège. Le menu et les routes ne sont là que
> pour le confort de l'utilisateur.

---

## 2. Correction par correction

### P0-1 · Accès sans connexion

**Le problème.** 26 actions répondaient à n'importe qui sur Internet, sans être connecté : liste de tous les contacts,
liste des agents **avec leurs salaires**, création d'agents, import de leads, et même une page (`InitController`) qui
créait un administrateur avec le mot de passe `role123` et **affichait ce mot de passe dans la réponse**.

**Pourquoi c'est dangereux.** Vol de données clients (RGPD), falsification des appels, prise de contrôle du CRM.

**Ce qui a été changé.**

| Fichier | Changement |
|---|---|
| `Controllers/InitController.cs` | **supprimé** (aucune référence ailleurs) |
| `Controllers/ContactController.cs` | `[Authorize]` sur la **classe** ; suppression réservée aux admins ; un agent ne voit que ses contacts |
| `Controllers/AgentController.cs` | `[Authorize]` sur la classe ; création/modification/suppression : admins ; un agent n'accède qu'à ses données |
| `Controllers/DashboardController.cs` | `[Authorize]` + vérification que l'id de l'URL est le tien |
| `Controllers/LeadsController.cs` | `[Authorize(Roles = "ADMIN,QUALITE,SuperAdmin")]` (comme `LeadsImportController`) |
| `Controllers/CallPerformanceController.cs` | `agents-from-calls` protégé |
| `Program.cs` + `hooks/useChat.ts` | WebSocket de messagerie protégé (voir plus bas) |

**Le réflexe clé : `[Authorize]` au niveau de la classe.**

```csharp
// AVANT : seules quelques actions avaient [Authorize], les autres étaient ouvertes
public class AgentController : ControllerBase { ... }

// APRÈS : TOUTES les actions de la classe exigent un jeton valide par défaut
[Authorize]
public class AgentController : ControllerBase { ... }
```

Ainsi, une action ajoutée demain est protégée **par défaut**. On ouvre ensuite explicitement ce qui doit l'être
(seulement `login`, `first-login`, `forgot-password`…).

**Ne pas faire confiance à l'identifiant que le client envoie (faille « IDOR »).** Un agent connecté pouvait lire les
données d'un collègue en changeant le numéro dans l'adresse (`/api/agent/10/dashboard`) ou enregistrer un appel au nom
d'un autre en changeant `agentId` dans le corps de la requête. Nouvelle règle, dans `UserContextHelper` :

```csharp
public static bool CanAccessAgentData(ClaimsPrincipal user, long agentId) =>
    IsAdmin(user) || GetUserId(user) == agentId;      // l'agent lui-même, ou un admin
```

utilisée dans chaque action qui reçoit un identifiant d'agent :

```csharp
if (!UserContextHelper.CanAccessAgentData(User, id)) return Forbid();   // 403
```

**La messagerie temps réel (WebSocket).** Avant : `app.Map("/ws/messages/{userId}", ...)` acceptait n'importe qui, avec
n'importe quel `userId` (on pouvait écouter les messages d'un autre). Maintenant :

* `.RequireAuthorization()` sur la route ;
* le jeton est lu dans l'adresse (`?access_token=...`) car **un navigateur ne peut pas ajouter d'en-tête
  `Authorization` à un WebSocket** (`OnMessageReceived` dans `Program.cs`) ;
* l'id de l'adresse doit être celui du jeton, sinon 403 ;
* côté écran, `useChat.ts` ajoute le jeton à l'adresse.

**Vérifié par.** `SecurityRegressionTests` (13 routes en lecture, 8 en écriture, la page Init, l'isolation entre agents,
le WebSocket) + le scénario réel sur base vide (section B : 10 vérifications OK).

**À retenir.**
* « Ça marche quand je suis connecté » ne prouve rien : **il faut tester ce qui se passe quand personne n'est connecté**.
  Les 100 anciens tests étaient verts alors que 26 actions étaient ouvertes, parce qu'aucun ne posait cette question.
* Un identifiant venant du client (URL, corps) n'est jamais une preuve d'identité : compare-le à celui du jeton.

---

### P0-2 · Un admin peut devenir super admin

**Le problème.** Les routes `PUT /api/auth/users/{id}`, `DELETE …`, et `POST /api/auth/admin-reset-password`
vérifiaient seulement « l'appelant est-il admin ? », jamais « **quel compte** est modifié ? ». Un admin changeait donc le
mot de passe du super admin, puis se connectait avec. La réponse de `admin-reset-password` contenait même le nouveau mot
de passe en clair.

**Ce qui a été changé.** Nouveau fichier `Authorization/UserManagementGuard.cs` :

```csharp
public static bool CanManage(ClaimsPrincipal actor, string? targetRole) =>
    !IsSuperAdmin(targetRole) || actor.IsInRole(Roles.SuperAdmin);   // seul un super admin touche un super admin
public static bool IsSelf(ClaimsPrincipal actor, long targetUserId) => ...  // pour interdire l'auto-désactivation
```

appliqué dans `AuthController` (modifier, désactiver, réinitialiser) et `AdminController` (désactiver). Nobody ne peut
désactiver son propre compte (sinon on peut verrouiller le dernier admin dehors).

**Vérifié par.** 4 tests (`Admin_CannotChangeThePasswordOfTheSuperAdmin`, `…ResetOrDeactivate…`, `Nobody_CanDeactivateHisOwnAccount`,
`SuperAdmin_CanStillManageAccounts…`) + section E du scénario réel (5 vérifications OK).

**À retenir.** Une règle d'accès a **deux** questions : « *qui* demande ? » **et** « *sur quoi* ? ».

---

### P0-3 · Premier déploiement impossible

**Le problème.** Sur une base de données vide, rien ne créait les tables (la chaîne de migrations est cassée, voir
`MERGE_NOTES.md`) ni le premier compte. L'API démarrait, répondait « healthy », mais toutes les requêtes donnaient une
erreur 500. Le seul moyen de créer un admin était la page ouverte `InitController`.

**Ce qui a été changé.** Nouveau `Data/DbInitializer.cs`, appelé une fois au démarrage (`Program.cs`) :

1. **Crée les tables** si la base n'en contient aucune (`Database.EnsureCreatedAsync()`). Si la base a déjà des tables :
   **rien n'est touché** (installation existante protégée).
2. **Crée les lignes de la table `roles`** attendues par les autres modules.
3. **Crée le premier super admin** à partir de deux variables d'environnement, **seulement** s'il n'existe aucun super admin :
   `Bootstrap__AdminEmail` et `Bootstrap__AdminPassword`. Il n'y a **jamais** de compte ni de mot de passe par défaut.
   * le mot de passe est refusé s'il fait moins de 12 caractères, s'il mélange moins de 3 types de caractères, ou s'il est
     dans la liste des mots de passe connus (`role123`, `Test1234!`…) : `Helpers/PasswordPolicy.cs` ;
   * seul le **hash BCrypt** est stocké ;
   * `MustChangePassword = true` : le mot de passe de déploiement (écrit dans un fichier ou une variable CI) doit être
     changé à la première connexion (le flux « first-login » existait déjà).
4. **Copie les comptes** dans la seconde table d'utilisateurs (voir P0-4).

Variables ajoutées dans `docker-compose.yml`, `render.yaml`, `.env.example`, et un paragraphe dans le `README.md`.
Options d'arrêt d'urgence : `Database__AutoCreateSchema=false`, `Database__MirrorUsers=false`.

**Vérifié par.** `ImportAndBootstrapTests` (création avec mot de passe haché ; refus des mots de passe faibles ou absents ;
aucune création si un super admin existe) et le scénario réel : base à **0 table → 52 tables**, journal
`Empty database detected… First SuperAdmin account created…`, puis redémarrage : `Database already contains tables: schema left untouched`.

**À retenir.**
* Un déploiement qui « démarre » n'est pas un déploiement qui « marche ». Il faut tester **sur une base vide**.
* Ne jamais mettre de mot de passe par défaut dans le code : on le fournit au déploiement, et on oblige à le changer.

---

### P0-4 · L'import de fichiers était bloqué (5 causes)

Quand on importe un fichier de contacts, cinq problèmes se cumulaient :

**① Mauvais noms de rôles dans le code (personne ne pouvait créer un « type de lead »).**
```csharp
[Authorize(Roles = "Admin,ServiceTechnique")]      // AVANT : ces rôles n'existent pas
[Authorize(Roles = "ADMIN,SuperAdmin,TECH")]       // APRÈS : les vrais noms, comme dans la base
```
Corrigé dans `CountryController`, `LeadTypeController`, `SupplierController`. Les rôles réels sont `SuperAdmin`, `ADMIN`,
`AGENT`, `QUALITE`, `TECH`, `COMMERCIAL`, `CONFIRMATRICE` (**la casse compte** : `Admin` ≠ `ADMIN`). J'ai vérifié qu'aucun autre
nom erroné ne reste dans les 140 `[Authorize(Roles=…)]` du projet.

**② La seconde table d'utilisateurs (la plus subtile).** L'application a **deux** tables d'utilisateurs :
`Utilisateur` (les comptes qui se connectent) et `users` (utilisée par les fournisseurs, fichiers, campagnes). Ces modules
écrivent l'id du jeton (= `Utilisateur.Id`) dans une colonne qui pointe vers `users.id`. Sans ligne correspondante, la base
refuse (erreur de clé étrangère) : **HTTP 500 pour tous les vrais utilisateurs**.

Pansement mis en place, `Data/AppUserMirror.cs` : pour chaque compte, on garde une ligne « miroir » dans `users` **avec le même
id** (mot de passe `!mirror-no-login` : personne ne peut se connecter avec). Elle est créée au démarrage pour les comptes
existants et juste après chaque création de compte (`AdminService`, `AgentService`). La séquence d'identifiants de `users`
est déplacée à 1 000 000 pour éviter toute collision avec les agents créés par le module campagnes.

> ⚠️ C'est un **pansement**, pas la solution. La vraie solution est **une seule table d'utilisateurs**. À valider avec un senior.

**③ Deux lectures en parallèle sur la même connexion base.** `SupplierService` faisait `Task.WhenAll(...)` sur deux requêtes
du même `DbContext`. Or un `DbContext` **n'est pas thread-safe** : erreur « A second operation was started on this context »
(500). Corrigé en les faisant l'une après l'autre.

**④ Détection de la colonne téléphone.** La liste de mots-clés contenait la lettre `"n"` (pour « N° ») avec une recherche
« contient » : « **n**om » contient un « n », donc la colonne *nom* était prise pour le téléphone et **tout le fichier était
rejeté**. Nouveau `Helpers/PhoneColumnDetector.cs` : mots-clés clairs d'abord (`téléphone`, `phone`, `portable`, `mobile`, `gsm`),
puis `tel…`/`numéro`, puis les mots ambigus **seulement si l'en-tête est exactement ce mot**.

**⑤ L'import « Technique » ne créait aucun contact.** `FichierImportHelper.SaveUploadAsync` enregistrait le fichier, **comptait
les lignes**, et répondait « importé avec succès » (même pour un `.exe`). Il est réécrit : vérifie le type (.csv) et la taille
(20 Mo), détecte `,` `;` ou tabulation, valide chaque numéro (8 à 15 chiffres), ignore les doublons (dans le fichier **et** déjà
en base), insère par lots de 1 000 dans une transaction (tout ou rien), et enregistre les **vrais** chiffres. Les contrôleurs
renvoient le détail (`contactsCount`, `errorsCount`, premières erreurs) et un 400 avec un message clair quand le fichier est refusé ;
la page du service technique affiche ce message.

**Leçon de performance (à garder).** Ma première version mettait **249 secondes** pour 50 000 lignes. J'ai d'abord soupçonné
les journaux (faux), puis la vérification des doublons (faux aussi), avant de **mesurer** : la vraie cause était que l'entité
`FichierImport` restait « suivie » par EF, qui ajoutait chacun des 50 000 contacts à sa liste interne avec une recherche
linéaire à chaque fois (≈ 1 milliard de comparaisons). Une ligne (`Entry(fichier).State = Detached`) → **25 secondes**.
*Mesurer avant d'optimiser, et changer une chose à la fois.*

**Vérifié par.** Scénario réel sur base vide (section G) : fichier de 50 000 lignes, colonne téléphone en 3ᵉ position,
**49 800 valides, 100 invalides, 100 doublons**, réimporter le même fichier est refusé. Tests unitaires : 11 formes d'en-têtes,
13 cas d'import.

**À retenir.** Quand un traitement échoue « seulement en vrai », cherche les **hypothèses cachées** (une ligne doit exister dans une
autre table, un rôle s'écrit différemment…) et vérifie sur une base propre.

---

### P0-5 · La liste des contacts saturait le serveur

**Le problème.** `GET /api/Contact` renvoyait **toute la table** : 41 Mo pour 200 000 contacts, et c'était ouvert à tous. Dix
requêtes simultanées faisaient passer la mémoire de 1,2 à 2,6 Go et durer 18 secondes chacune : un déni de service trivial.

**Ce qui a été changé.**
* `ContactController.GetAll(page, pageSize, search)` : 50 par page par défaut, **200 maximum** (une demande de 100 000 est ramenée à
  200), recherche côté serveur, total dans l'en-tête `X-Total-Count`. Un agent ne voit que ses contacts.
* `Program.cs` : `WithExposedHeaders("X-Total-Count")` : **par défaut, un navigateur masque les en-têtes personnalisés** d'une
  réponse venant d'un autre domaine ; sans cela, le total n'aurait pas été lisible en production (site et API sur deux domaines).
* Frontend : `agentService.getContactsPage`, et `ConfContactsListPage` (boutons Précédent / Suivant, recherche retardée de 300 ms).

**Vérifié par.** 5 tests (`ContactPagingTests`) et, dans un vrai navigateur, 50 lignes affichées, « Total : 49800 contacts »
lu depuis l'en-tête, page 2, recherche. Résultat mesuré : 11 Ko, 0,2–0,3 s, et **10 requêtes simultanées en moins de 0,5 s**.

**À retenir.** Toute liste renvoyée par un serveur doit avoir une **limite**, et le client ne doit jamais pouvoir la lever.

---

### Le modèle d'accès « super admin = tout, admin = tout sauf salaires et permissions »

**Avant**, chaque contrôleur listait à la main `"ADMIN,SuperAdmin"`. Quand un contrôleur oubliait le super admin (cas de
`Confirmation1`, `Commercial`, `Agent/me/*`), celui-ci recevait un 403, alors que l'interface lui montrait ces pages.

**Maintenant** : `Authorization/AdminAccessHandler.cs`, branché dans `Program.cs` (`AddSingleton<IAuthorizationHandler, …>`).
ASP.NET interroge tous les « handlers » enregistrés et autorise dès qu'**un seul** répond oui. Le nôtre ne dit jamais non, il
ajoute seulement des « oui » :

```csharp
if (user.IsInRole("SuperAdmin"))                                   → passe TOUS les contrôles de rôle
else if (user.IsInRole("ADMIN") && !IsReservedToSuperAdmin(req))   → passe tout, SAUF [Authorize(Roles = "SuperAdmin")]
```

Pour les routes à permissions (`[RequirePermission]`), `Permissions.RolePermissions["ADMIN"]` est maintenant **toutes** les
permissions du fichier (trouvées par réflexion : une permission ajoutée demain est donnée automatiquement) **moins**
`Roles.AssignPermissions` et `Users.AssignPermissions` (la gestion des permissions).

**Les salaires** (le super admin seulement, plus l'agent pour son propre salaire) :

| Où | Changement |
|---|---|
| `SalaryController` (tout le contrôleur) | `[Authorize(Roles = "SuperAdmin")]` (avant : `ADMIN,QUALITE,SuperAdmin`) |
| `ExportController.salaries` | super admin seulement |
| `GET /api/Agent`, `/{id}` | `salaireBase` et `primeAssiduite` mis à 0 pour l'admin |
| `POST/PUT /api/Agent`, `/api/Agents` | un salaire envoyé par un admin est ignoré |
| `GET /api/Agent/{id}/remuneration` | agent concerné ou super admin |
| `GET /api/Agent/{id}/performance` | les primes sont mises à 0 pour l'admin |
| `analytics/crm/agents-performance`, `quality/crm/agent/{id}` | `salaireMois` / `salaryHistory` vides pour l'admin |
| `Sidebar.tsx`, `App.tsx` | entrées « Salaires » et « Permissions » retirées du menu admin ; routes protégées par `SuperAdminRoute` |

> ⚠️ **Décision à valider** : le rôle **Qualité** avait accès aux salaires (`ADMIN,QUALITE,SuperAdmin`). Il ne l'a plus.

**Vérifié par.** `AccessMatrixTests` : **12 routes × 9 comptes** (chaque rôle doit avoir exactement l'accès prévu, et
les anonymes un 401), `AccessRulesUnitTests`, `SecurityRegressionTests` (salaires), et le scénario réel + navigateur (menu admin
sans Salaires/Permissions, `/admin/salaries` taper à la main → renvoyé à l'accueil, le super admin les ouvre).

**Un piège que le test a révélé.** Mon premier masquage des salaires ne marchait pas : le service renvoie une séquence
**« paresseuse »** (recalculée à chaque lecture). Je modifiais des objets jetés, puis la réponse recréait des objets avec les
salaires. Correctif : `.ToList()` pour figer la liste avant de la modifier. *Quand tu modifies des objets venant d'un `Select`/`IEnumerable`,
matérialise d'abord.*

---

## 3. Mes trois erreurs en chemin (et pourquoi c'est utile de les voir)

1. **Fichier tronqué.** Mon script d'ajout coupait le fichier au dernier `}` et a supprimé deux lignes (`record LogPauseDto…`)
   situées **après** la classe. Le compilateur l'a signalé immédiatement ; je les ai restaurées depuis git. *Leçon : après une
   modification automatique, compile tout de suite ; et `git diff` pour relire ce qui a vraiment changé.*
2. **Liste paresseuse** (voir ci-dessus) : attrapée par un test, pas par la lecture du code. *Leçon : écris le test qui prouve le comportement.*
3. **Optimisation à l'aveugle** (249 s) : deux fausses pistes avant la mesure. *Leçon : mesurer.*

---

## 4. Les tests

**Comment les lancer** (depuis la racine du projet) :

```bash
dotnet test Backend/tests/CRM.API.Tests/CRM.API.Tests.csproj
```

Si ton serveur de développement tourne (le fichier `CRM.API.exe` est verrouillé), utilise un dossier de sortie séparé :

```bash
dotnet test Backend/tests/CRM.API.Tests/CRM.API.Tests.csproj --artifacts-path ./.test-artifacts
```

**Résultat : 216 tests, 216 verts** (100 avant). Fichiers ajoutés :

| Fichier | Ce qu'il prouve |
|---|---|
| `Integration/AccessMatrixTests.cs` | pour chaque route sensible, les 9 rôles ont **exactement** l'accès prévu ; les anonymes ont 401 |
| `Integration/SecurityRegressionTests.cs` | un test par faille trouvée : routes autrefois ouvertes, page Init supprimée, isolation entre agents, salaires, protection du super admin, WebSocket, copie des comptes |
| `Integration/ContactPagingTests.cs` | pagination, plafond de 200, recherche, filtre par agent, suppression réservée aux admins |
| `AccessRulesUnitTests.cs` | permissions de l'admin, `AdminAccessHandler`, règles d'accès aux données d'un agent, règle des salaires, garde du super admin |
| `ImportAndBootstrapTests.cs` | colonne téléphone, mot de passe, import réel (doublons, `;`, fichiers refusés), premier admin, copie des comptes |
| `Integration/TestHttp.cs`, `ApiFactory.cs` | outils partagés + **les comptes de test** |

**Les comptes de test** (mot de passe `Test1234!` ; base **en mémoire**, créés par `ApiFactory`) :

| Rôle | E-mail | Id |
|---|---|---|
| Super admin | `superadmin@test.com` | 4 |
| Admin | `admin@test.com` | 1 |
| Agent | `agent@test.com` | 2 |
| Agent (collègue, pour tester l'isolation) | `agent2@test.com` | 10 |
| Qualité | `qualite@test.com` | 3 |
| Commercial | `commercial@test.com` | 5 |
| Service technique | `tech@test.com` | 6 |
| Confirmatrice 1 | `conf1@test.com` | 7 |
| Confirmatrice 2 | `conf2@test.com` | 8 |
| Confirmatrice client | `confclient@test.com` | 9 |

Pour un environnement de **développement** (vraie base), `Backend/scripts/sql/seed_e2e_users.sql` crée déjà un compte par rôle
(`superadmin@ebi.com`, `admin@ebi.com`, `agent@ebi.com`…). **Ne jamais l'exécuter en production.**

**Vérification en conditions réelles** (en plus des tests) : API en mode Production sur une base **vide** + vrai navigateur :
63 vérifications (premier déploiement, accès, comptes, droits, import, liste), puis 15 vérifications dans l'interface. Tout est OK.

---

## 5. Ce qui n'est PAS corrigé, effets de bord, et décisions à valider

**Effet sur ta base de développement au prochain démarrage de l'API** (inoffensif mais bon à savoir) :
* rien n'est recréé (la base a déjà des tables) ;
* les lignes manquantes de `roles` sont ajoutées ;
* chaque compte de `Utilisateur` reçoit une ligne miroir dans `users` (même id) si elle n'existe pas ;
* la séquence d'ids de `users` passe à 1 000 000.
Pour désactiver : `Database__MirrorUsers=false`.

> ⚠️ **Redémarre ton serveur de développement** (port 5241) : il tourne encore avec l'ancien code.

**À valider avec un senior :**
1. **Deux tables d'utilisateurs** : le miroir est un pansement ; faut-il fusionner les deux ?
2. Une base créée par `EnsureCreated` **n'a pas d'historique de migrations** : à régler en même temps que la chaîne de migrations cassée.
3. Un **ADMIN peut encore créer ou modifier d'autres ADMIN** (seul le super admin est protégé). Voulu ?
4. **Qualité n'a plus accès aux salaires** (il l'avait avant).
5. Le jeton passe dans l'adresse du WebSocket (usage standard, mais il peut apparaître dans les journaux d'un proxy).

**Restent à faire (P1, déjà dans le rapport de tests)** : limite de connexion partagée derrière un proxy, doublons de pointage et de
comptes en cas de clics simultanés (index uniques), employé désactivé qui garde son jeton, santé qui reste « OK » base coupée, deux
écrans qui plantent (`AI/forecast`, `analytics/crm/comparison`), SMTP, sauvegardes, clés à changer. Détails mineurs liés à ce travail :
un fichier refusé reste quand même copié sur le disque ; deux imports **simultanés** du même fichier peuvent créer des doublons (il
faudrait un index unique sur le téléphone) ; l'import rapide lit les téléphones existants en mémoire (à surveiller au-delà de quelques millions de contacts).

**Tests frontend** : `vitest` échoue sur ta machine à cause d'un `package-lock.json` modifié localement (`@testing-library/dom` manquant) :
sans rapport avec ces corrections ; `npm run build` et `tsc` (hors fichiers de test) passent.

---

## 6. Liste des fichiers modifiés (pour relire avec `git diff`)

**Créés** : `Authorization/AdminAccessHandler.cs`, `Authorization/UserManagementGuard.cs`, `Data/AppUserMirror.cs`, `Data/DbInitializer.cs`,
`Helpers/PasswordPolicy.cs`, `Helpers/PhoneColumnDetector.cs`, 6 fichiers de tests (section 4).
**Supprimé** : `Controllers/InitController.cs`.
**Backend modifiés** : `Program.cs`, `appsettings.json` (journaux EF Core en `Warning` : un import de 50 000 lignes écrivait 186 000 lignes de journal),
`Constants/Permissions.cs`, `Helpers/UserContextHelper.cs`, `Helpers/FichierImportHelper.cs`, contrôleurs (`Admin`, `Agent`, `Agents`,
`AnalyticsCrm`, `Auth`, `CallPerformance`, `Confirmation1`, `Contact`, `Country`, `Dashboard`, `Export`, `LeadType`, `Leads`,
`QualityCrm`, `Salary`, `Supplier`, `Technique`), services (`AdminService`, `AgentService`, `SourceFileService`, `SupplierService`).
**Frontend** : `App.tsx`, `Sidebar.tsx`, `useChat.ts`, `ConfContactsListPage.tsx`, `FichierContacts.tsx`, `agentService.ts`.
**Déploiement** : `docker-compose.yml`, `render.yaml`, `.env.example`, `README.md`.

## 7. Premier déploiement : mode d'emploi en 4 lignes

1. Renseigne `BOOTSTRAP_ADMIN_EMAIL` et `BOOTSTRAP_ADMIN_PASSWORD` (12 caractères minimum, 3 types de caractères) + les secrets (`JWT_SECRET`, `DB_PASSWORD`, clé IA).
2. Lance l'application : les tables et le premier super admin sont créés tout seuls (regarde le journal).
3. Connecte-toi avec cet e-mail et ce mot de passe : l'écran te demande d'en choisir un nouveau.
4. Retire `BOOTSTRAP_ADMIN_PASSWORD` de la configuration.
