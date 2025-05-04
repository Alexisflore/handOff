// Script pour tester l'API de versions directement
const fetch = require('node-fetch');

async function main() {
  try {
    console.log('=== Test de l\'API /api/versions ===');
    
    // Paramètres pour le test (basés sur les données réelles)
    const projectId = '550e8400-e29b-41d4-a716-446655440020';
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const stepId = '5a3f8393-50d8-4b01-8e7d-33aee2d0e8d7'; // ID de l'étape "current"
    
    // Données à envoyer à l'API
    const versionData = {
      name: 'Version API test',
      description: 'Version créée par le script de test API',
      file_url: 'https://example.com/sample-test.jpg',
      file_name: 'sample-test.jpg',
      file_type: 'image/jpeg',
      step_id: stepId,
      project_id: projectId,
      user_id: userId
    };
    
    console.log('Données de version à envoyer:', JSON.stringify(versionData, null, 2));
    
    // Effectuer l'appel API
    console.log('\nAppel à l\'API /api/versions...');
    
    // URL de l'API (utilisation de localhost pour le développement)
    const apiUrl = 'http://localhost:3000/api/versions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(versionData)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Erreur lors de l\'appel API:', response.status, response.statusText);
      console.error('Détails:', responseData);
      return;
    }
    
    console.log('Réponse API:', JSON.stringify(responseData, null, 2));
    console.log('\n✅ Test API réussi!');
    
  } catch (error) {
    console.error('Erreur non gérée:', error);
  }
}

main(); 