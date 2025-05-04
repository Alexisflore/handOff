require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialisation du client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Structure attendue de la base de données
const expectedSchema = {
  projects: {
    description: "Table principale des projets",
    fields: [
      { name: "id", type: "uuid", description: "Identifiant unique du projet" },
      { name: "name", type: "text", description: "Nom du projet" },
      { name: "description", type: "text", description: "Description du projet" },
      { name: "client_id", type: "uuid", description: "Référence au client", references: "clients(id)" },
      { name: "created_at", type: "timestamp", description: "Date de création" },
      // Autres champs...
    ],
    relationships: [
      { table: "clients", field: "client_id", type: "many-to-one" },
      { table: "project_steps", field: "project_id", type: "one-to-many" },
      { table: "deliverables", field: "project_id", type: "one-to-many" }
    ]
  },
  
  project_steps: {
    description: "Étapes du projet (affichées dans le DeliverableSelector)",
    fields: [
      { name: "id", type: "uuid", description: "Identifiant unique de l'étape" },
      { name: "project_id", type: "uuid", description: "Référence au projet", references: "projects(id)" },
      { name: "title", type: "text", description: "Titre de l'étape" },
      { name: "description", type: "text", description: "Description de l'étape" },
      { name: "status", type: "text", description: "Statut de l'étape (ex: upcoming, current, completed)" },
      { name: "created_at", type: "timestamp", description: "Date de création" },
      // Autres champs...
    ],
    relationships: [
      { table: "projects", field: "project_id", type: "many-to-one" },
      { table: "deliverables", field: "step_id", type: "one-to-many" }
    ]
  },
  
  deliverables: {
    description: "Versions des livrables associés aux étapes",
    fields: [
      { name: "id", type: "uuid", description: "Identifiant unique du livrable" },
      { name: "project_id", type: "uuid", description: "Référence au projet", references: "projects(id)" },
      { name: "step_id", type: "uuid", description: "Référence à l'étape", references: "project_steps(id)" },
      { name: "title", type: "text", description: "Titre du livrable" },
      { name: "description", type: "text", description: "Description du livrable" },
      { name: "file_url", type: "text", description: "URL du fichier" },
      { name: "file_type", type: "text", description: "Type du fichier" },
      { name: "file_name", type: "text", description: "Nom du fichier" },
      { name: "version_number", type: "integer", description: "Numéro de version" },
      { name: "is_latest", type: "boolean", description: "Indique si c'est la dernière version" },
      { name: "status", type: "text", description: "Statut du livrable (ex: pending, approved, rejected)" },
      { name: "created_by", type: "uuid", description: "Référence à l'utilisateur créateur", references: "users(id)" },
      { name: "created_at", type: "timestamp", description: "Date de création" },
      // Autres champs...
    ],
    relationships: [
      { table: "projects", field: "project_id", type: "many-to-one" },
      { table: "project_steps", field: "step_id", type: "many-to-one" },
      { table: "users", field: "created_by", type: "many-to-one" },
      { table: "comments", field: "deliverable_id", type: "one-to-many" }
    ]
  },
  
  // Autres tables...
  clients: {
    description: "Informations sur les clients",
    relationships: [
      { table: "projects", field: "client_id", type: "one-to-many" }
    ]
  },
  
  users: {
    description: "Utilisateurs du système",
    relationships: [
      { table: "deliverables", field: "created_by", type: "one-to-many" },
      { table: "comments", field: "user_id", type: "one-to-many" }
    ]
  },
  
  comments: {
    description: "Commentaires sur les livrables",
    relationships: [
      { table: "deliverables", field: "deliverable_id", type: "many-to-one" },
      { table: "users", field: "user_id", type: "many-to-one" }
    ]
  }
};

async function generateMermaidDiagram() {
  let mermaidCode = 'erDiagram\n';
  
  // Ajouter les entités et relations au diagramme
  for (const [tableName, tableInfo] of Object.entries(expectedSchema)) {
    if (tableInfo.relationships) {
      tableInfo.relationships.forEach(rel => {
        const cardinality = rel.type === 'one-to-many' 
          ? '1 ||--o{ ' 
          : rel.type === 'many-to-one'
            ? '1 }o--|| '
            : '1 ||--|| ';
        
        const sourceTable = tableName;
        const targetTable = rel.table;
        const relationLabel = rel.field;
        
        // Éviter les duplications en vérifiant si la relation existe déjà
        // dans l'autre sens pour les relations one-to-many
        if (rel.type === 'one-to-many') {
          if (expectedSchema[rel.table]?.relationships?.some(r => 
              r.table === tableName && r.type === 'many-to-one')) {
            return; // Ne pas ajouter cette relation car elle existe dans l'autre sens
          }
        }
        
        mermaidCode += `    ${sourceTable} ${cardinality} ${targetTable} : "${relationLabel}"\n`;
      });
    }
  }
  
  return mermaidCode;
}

function generateMarkdownSchema() {
  let markdown = `# Structure de la Base de Données\n\n`;
  
  // Informations générales
  markdown += `## Vue d'ensemble\n\n`;
  markdown += `Cette base de données est organisée selon une structure hiérarchique :\n\n`;
  markdown += `1. **Projets** (projects) - Contient les informations de base sur chaque projet\n`;
  markdown += `2. **Étapes** (project_steps) - Représente les différentes étapes/livrables d'un projet\n`;
  markdown += `3. **Versions** (deliverables) - Stocke les différentes versions pour chaque étape/livrable\n\n`;
  
  markdown += `## Diagramme des Relations\n\n`;
  markdown += `\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\n`;
  
  // Description détaillée de chaque table
  markdown += `## Description des Tables\n\n`;
  
  for (const [tableName, tableInfo] of Object.entries(expectedSchema)) {
    markdown += `### ${tableName}\n\n`;
    markdown += `${tableInfo.description || 'Aucune description disponible.'}\n\n`;
    
    if (tableInfo.fields) {
      markdown += `#### Champs\n\n`;
      markdown += `| Nom | Type | Description | Référence |\n`;
      markdown += `|-----|------|-------------|----------|\n`;
      
      tableInfo.fields.forEach(field => {
        markdown += `| ${field.name} | ${field.type} | ${field.description || ''} | ${field.references || ''} |\n`;
      });
      
      markdown += `\n`;
    }
    
    if (tableInfo.relationships) {
      markdown += `#### Relations\n\n`;
      markdown += `| Table liée | Champ | Type de relation |\n`;
      markdown += `|------------|-------|------------------|\n`;
      
      tableInfo.relationships.forEach(rel => {
        markdown += `| ${rel.table} | ${rel.field} | ${rel.type} |\n`;
      });
      
      markdown += `\n`;
    }
  }
  
  // Explication du flux de données
  markdown += `## Flux de Données\n\n`;
  markdown += `Le système fonctionne comme suit :\n\n`;
  markdown += `1. Un **projet** est créé pour un client\n`;
  markdown += `2. Des **étapes** (project_steps) sont définies pour le projet et affichées dans le DeliverableSelector\n`;
  markdown += `3. Pour chaque étape, des **versions** (deliverables) peuvent être créées\n`;
  markdown += `4. Chaque version a un fichier associé et peut recevoir des commentaires\n`;
  markdown += `5. Les versions sont gérées avec un système de numérotation et un indicateur is_latest\n\n`;
  
  markdown += `## Exemple de Flux\n\n`;
  markdown += `1. Projet "Refonte Site Web" pour le client "ACME Inc."\n`;
  markdown += `2. Étapes du projet :\n`;
  markdown += `   - Wireframes\n`;
  markdown += `   - Maquettes\n`;
  markdown += `   - Développement\n`;
  markdown += `3. Pour l'étape "Maquettes", plusieurs versions peuvent exister :\n`;
  markdown += `   - Version 1 : "Première proposition"\n`;
  markdown += `   - Version 2 : "Avec corrections couleurs"\n`;
  markdown += `   - Version 3 : "Version finale" (is_latest = true)\n\n`;
  
  return markdown;
}

async function generateSchema() {
  try {
    console.log('Génération du schéma de la base de données...');
    
    // Générer le diagramme Mermaid
    const mermaidCode = await generateMermaidDiagram();
    
    // Générer le fichier Markdown complet
    const markdown = generateMarkdownSchema().replace('${mermaidCode}', mermaidCode);
    
    // Écrire dans un fichier
    fs.writeFileSync('database-schema.md', markdown);
    
    console.log('Schema généré avec succès dans database-schema.md');
  } catch (error) {
    console.error('Erreur lors de la génération du schéma:', error);
  }
}

// Exécuter
generateSchema(); 