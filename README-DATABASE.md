# Structure de la Base de Données - Client Portal

## Vue d'ensemble

La base de données du Client Portal est organisée selon une structure hiérarchique à trois niveaux:

1. **Projets** (`projects`) - Table contenant les informations de base sur chaque projet
2. **Étapes** (`project_steps`) - Table représentant les différentes étapes/livrables d'un projet
3. **Versions** (`deliverables`) - Table stockant les différentes versions pour chaque étape

## Relations entre les tables

La structure relationnelle est organisée comme suit:

```
projects (1) --- (*) project_steps (1) --- (*) deliverables
```

- Un projet peut avoir plusieurs étapes (`project_steps`)
- Une étape peut avoir plusieurs versions (`deliverables`)
- Chaque version est liée à un projet et (optionnellement) à une étape

## Structure des tables principales

### Table `projects`

Contient les informations générales sur chaque projet.

| Champ | Description |
|-------|-------------|
| id | Identifiant unique du projet (UUID) |
| title | Nom du projet |
| client_id | Référence au client |
| status | Statut du projet (ex: "In Progress") |
| ... | Autres champs informatifs |

### Table `project_steps`

Contient les étapes de chaque projet, affichées dans le `DeliverableSelector`.

| Champ | Description |
|-------|-------------|
| id | Identifiant unique de l'étape (UUID) |
| project_id | Référence au projet parent |
| title | Nom de l'étape |
| description | Description de l'étape |
| status | État de l'étape ("Completed", "In Progress", "Pending") |
| order_index | Position/ordre de l'étape dans le projet |
| ... | Autres champs informatifs |

### Table `deliverables`

Contient les différentes versions des livrables associés aux étapes.

| Champ | Description |
|-------|-------------|
| id | Identifiant unique de la version (UUID) |
| project_id | Référence au projet parent |
| step_id | Référence à l'étape parent (peut être NULL) |
| title | Nom du livrable |
| file_url | URL du fichier téléversé |
| file_type | Type MIME du fichier |
| file_name | Nom original du fichier |
| version_number | Numéro de version (commence à 1) |
| is_latest | Boolean indiquant si c'est la dernière version |
| status | Statut du livrable ("pending", "approved", "rejected") |
| created_by | Référence à l'utilisateur qui a créé le livrable |
| ... | Autres champs informatifs |

## Flux d'utilisation

1. Un projet est créé et associé à un client
2. Des étapes (`project_steps`) sont définies pour le projet
3. L'utilisateur sélectionne une étape dans le `DeliverableSelector`
4. Pour chaque étape, l'utilisateur peut ajouter des versions (`deliverables`)
5. Les versions sont numérotées automatiquement, et seule la dernière version est marquée comme `is_latest = true`

## Processus d'ajout d'une nouvelle version

1. L'utilisateur sélectionne une étape dans le `DeliverableSelector`
2. Il clique sur "Ajouter une version" et remplit le formulaire
3. Le fichier est téléversé vers Vercel Blob via `/api/upload`
4. Les informations de la version sont envoyées à `/api/versions`
5. Le backend:
   - Vérifie si le `deliverable_id` (qui est en fait l'ID de l'étape) existe dans `project_steps`
   - Calcule le prochain numéro de version pour cette étape
   - Crée un nouvel enregistrement dans la table `deliverables`
   - Met à jour les autres versions de cette étape pour qu'elles ne soient plus `is_latest`

## Notes techniques

- Le `step_id` dans la table `deliverables` peut être NULL, mais c'est déconseillé car cela ne permet pas de suivre correctement les versions
- Dans l'interface, le terme "Deliverable" ou "Milestone" est utilisé pour les étapes (`project_steps`)
- Dans le code, `currentMilestone` fait référence à l'ID de l'étape sélectionnée (`project_steps.id`)
- Le flux de données entre le frontend et le backend utilise la terminologie suivante:
  - Frontend: `deliverable_id` (représente l'ID de l'étape sélectionnée dans le `DeliverableSelector`)
  - Backend: ce `deliverable_id` est utilisé pour déterminer le `step_id` à stocker dans la table `deliverables`

## Modifications apportées

1. La route `/api/versions` a été modifiée pour:
   - Vérifier explicitement si le `deliverable_id` fourni correspond à un `step_id` existant dans la table `project_steps`
   - Améliorer la journalisation pour faciliter le débogage
   - Gérer correctement le cas où le `deliverable_id` ne correspond pas à un `step_id` valide

2. Scripts d'analyse et de maintenance créés:
   - `analyze-database.js` - Analyse la structure et les relations dans la base de données
   - `db-schema.js` - Génère un schéma visuel de la base de données
   - `create-step.js` - Permet d'ajouter une nouvelle étape à un projet existant 