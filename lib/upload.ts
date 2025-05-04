/**
 * Utilitaire pour télécharger des fichiers via l'API Vercel Blob
 */

/**
 * Télécharge un fichier vers Vercel Blob et retourne l'URL du fichier
 * @param file Le fichier à télécharger
 * @param folder Le dossier de destination (optionnel)
 * @returns L'URL du fichier téléchargé
 */
export async function uploadFile(file: File, folder: string = 'uploads'): Promise<string> {
  try {
    // Créer un nom de fichier unique avec timestamp
    const uniqueFileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    console.log('Début de téléchargement:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      destination: uniqueFileName
    });
    
    // Préparation des données du formulaire
    const formData = new FormData();
    formData.append('file', file);
    
    // Appel à l'API d'upload
    console.log('Appel API upload...');
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-file-path': uniqueFileName
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur de réponse API:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Erreur lors du téléchargement: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Téléchargement réussi:', data.url);
    return data.url;
  } catch (error) {
    console.error('Erreur d\'upload:', error);
    throw error;
  }
}

/**
 * Valide le type et la taille d'un fichier
 * @param file Le fichier à valider
 * @param allowedTypes Types MIME autorisés
 * @param maxSizeInMB Taille maximale en MB
 * @returns {boolean} true si le fichier est valide
 */
export function validateFile(
  file: File, 
  allowedTypes: string[] = [], 
  maxSizeInMB: number = 20
): { valid: boolean; error?: string } {
  console.log('Validation de fichier:', {
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    fileType: file.type,
    maxSize: `${maxSizeInMB} MB`,
    allowedTypes: allowedTypes.length ? allowedTypes : 'tous types'
  });
  
  // Vérifier la taille du fichier
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return { 
      valid: false, 
      error: `La taille du fichier ne doit pas dépasser ${maxSizeInMB}MB` 
    };
  }
  
  // Si aucun type spécifié, on accepte tous les types
  if (allowedTypes.length === 0) {
    return { valid: true };
  }
  
  // Vérifier le type du fichier
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { valid: true };
} 