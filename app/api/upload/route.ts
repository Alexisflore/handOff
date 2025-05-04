import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Récupérer le token depuis les variables d'environnement
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || 
                 process.env.NEXT_BLOB_READ_WRITE_TOKEN || 
                 process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Vérifier si la requête contient un fichier
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    // Vérifier si le token est disponible
    if (!blobToken) {
      console.error('Erreur: Aucun token Vercel Blob trouvé dans les variables d\'environnement');
      return NextResponse.json(
        { error: 'Configuration du serveur incomplète. Token Blob manquant.' },
        { status: 500 }
      );
    }
    
    // Récupérer le chemin personnalisé depuis les en-têtes
    const filePath = request.headers.get('x-file-path') || `uploads/${Date.now()}_${file.name}`;
    
    // Upload du fichier vers Vercel Blob avec token explicite
    const { url } = await put(filePath, file, {
      access: 'public',
      contentType: file.type,
      token: blobToken // Passer le token explicitement
    });
    
    // Retourner l'URL du fichier téléversé
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Erreur lors du téléversement du fichier:', error);
    return NextResponse.json(
      { error: 'Échec du téléversement du fichier' },
      { status: 500 }
    );
  }
}

// Limiter la taille des fichiers à 20MB
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '20mb',
  },
}; 