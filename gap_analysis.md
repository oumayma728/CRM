# Analyse des Écarts (Gap Analysis) - Modules Restants

Voici une analyse complète de ton Cahier des Charges par rapport à ce qui est **déjà implémenté** dans notre architecture MVC actuelle, et ce qu'il **reste à développer**.

---

### ✅ 2. Transcription et analyse des appels
- [x] **Transcription automatique :** Fait (via `Whisper` en différé).
- [x] **Analyse du sentiment et des émotions :** Fait (via `DistilBERT`).
- [ ] **Identification agent / client (Diarization) :** *À FAIRE.* Actuellement, l'IA retranscrit tout en un seul bloc de texte sans séparer qui parle (Agent vs Client).
- [ ] **Analyse sémantique, intentions et mots-clés :** *PARTIEL.* Nous détectons les mots-clés simples via la fonction `detect_complaint`, mais il manque un vrai modèle d'extraction sémantique profonde (ex: SpaCy ou LLM). *Mise à jour .NET:* `CheckQualificationAsync` améliorée avec plus de mots-clés et détection de motifs de refus. `DetectRefusalAsync` ajoutée avec classification par catégorie (budget, timing, besoin, report).
- [ ] **Résumé automatique des appels :** *À FAIRE.* Pour l'instant, le "résumé" est juste constitué des 100 premiers caractères du texte dans la base de données. Il faut intégrer un modèle (ex: `BART` ou un appel API LLM) pour la synthèse au lieu d'une simple coupe (`text[:100]`).

### ✅ 3. Évaluation et scoring des agents
- [x] **Score qualité IA par appel :** Fait (Calcul sur le sentiment et plaintes dans `ai.py`).
- [x] **Historique de performance :** Fait (Accessible via les listes sur `analyse.py` et `agent.py`).
- [ ] **Temps de parole agent / client :** *À FAIRE.* Impossible sans la "Diarization" (voir point 2).
- [ ] **Respect du script & Gestion objections :** *À FAIRE.* Nécessite de traiter la transcription avec un prompt LLM (ex: OpenAI API / Llama 3) pour cocher des critères d'évaluation. *Partiel:* `DetectRefusalAsync` détecte les objections par catégorie avec suggestion de réponse.

### ❌ 4. Cohérence qualification et motifs de refus
- [ ] **Vérification qualification vs contenu réel :** *À FAIRE.* L'IA doit comparer ce que l'agent a saisi au téléphone (le motif listé) avec la transcription pour détecter des requalifications abusives vis-à-vis du client.
- [ ] **Détection des incohérences et refus :** *À FAIRE.* Nécessite un modèle d'analyse d'intention plus poussé alimenté par un LLM.

### ❌ 5. Productivité et alertes temps réel
- [x] **Alertes superviseur :** Fait (Affiché dans `supervision.py`).
- [ ] **Alerte inactivité > 30s & Temps de perte :** *À FAIRE.* L'application fonctionne actuellement a posteriori (après l'upload du fichier manuellement). Pour faire du temps réel, il faudrait se connecter directement aux Webhooks du système de téléphonie (ex: Asterisk, Aircall).
- [x] **Historisation des inactivités :** *FAIT.* (`AiService.AnalyzeInactivityAsync` calcule automatiquement `inactivity_detected` et `inactivity_duration` basé sur la durée d'appel et le volume de parole).

### ❌ 6. Détection IA du pointage (Premier et dernier appel)
- [ ] **Pointage et calcul du temps réel (Retards, départs) :** *À FAIRE.* (Les données `call_date` sont en base, il suffit maintenant de créer une nouvelle page/logique dans Streamlit pour filtrer par journée et comparer `MIN(call_date)` et `MAX(call_date)` pour chaque agent aux horaires planifiés).

### ✅ 7. Heures de pointe de production
- [x] **Analyse volumes par heure :** Fait (Graphique dans `supervision.py`).
- [x] **Détection plages les plus productives :** Fait (Lisible visuellement sur le graphique temporel de Streamlit).
- [x] **Aide à la planification :** *FAIT.* (`GenerateSchedulingTip` dans `AnalyticsService.GetOverviewAsync` génère des recommandations textuelles basées sur les données horaires).

### ❌ 8. Analyse géographique (Codes postaux)
- [ ] **Extraction et Analyse des codes postaux :** *À FAIRE.* Nécessite d'extraire les entités (NER) depuis la transcription, de remplir systématiquement la colonne `postal_code` de MySQL, et de créer une carte/graphique via `plotly` sur Streamlit.

### ❌ 9. Service de tracking post-appel
- [x] **Notifications (Email) :** Fait (Les fonctions d'envoi Gmail et Mailtrap existent dans `services/automation.py`).
- [x] **Suivi automatique & Relance :** *FAIT.* (`FollowupBackgroundService` s'exécute toutes les 6h et traite les relances : `a_relancer` → `relance_en_cours` → `perdu` après 3 tentatives).

### ✅ 10. Tableaux de bord et reporting
- [x] **Performance par agent, équipe et horaire :** Fait (Pages `agent.py` et `dashboard.py`).
- [ ] **Export des données :** *À FAIRE.* Il manque un bouton standard Streamlit "Télécharger en CSV / Excel" pour extraire l'analyse effectuée.

### ❌ 11. Sécurité et conformité
- [ ] **Conformité RGPD et Anonymisation :** *À FAIRE.* Il faut scripter la censure des numéros de carte bancaire (regex), noms de famille, etc. sur la transcription AVANT l'insertion en base de données de production MySQL.
- [ ] **Gestion des accès (Login) :** *À FAIRE.* Actuellement, n'importe qui accédant à `localhost` peut voir toutes les pages. Il faut bloquer `supervision.py` et `agent.py` aux seuls superviseurs en intégrant une authentification basique dans le MVC.
