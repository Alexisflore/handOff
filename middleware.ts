import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Liste des routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/login', '/api/auth', '/_next', '/favicon.ico']

export async function middleware(request: NextRequest) {
  console.log('⭐ Middleware démarré pour:', request.nextUrl.pathname)
  
  // Créer une nouvelle instance de réponse à chaque requête
  const response = NextResponse.next()
  
  try {
    // Créer le client Supabase avec la requête et la réponse
    const supabase = createMiddlewareClient({ req: request, res: response })
    
    // Obtenir les cookies de la requête pour le débogage
    const cookieHeader = request.headers.get('cookie') || ''
    // console.log('🍪 Cookies reçus:', cookieHeader.split(';').map(c => c.trim()).join(' | '))
    
    // Vérifier la session à chaque requête
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('❌ Erreur lors de la récupération de la session:', error.message)
    }
    
    const session = data?.session
    
    // Vérifier si la route actuelle est publique
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
    
    // Debug
    console.log('📝 Middleware info:', {
      path: request.nextUrl.pathname,
      sessionExists: !!session, 
      userId: session?.user?.id || 'aucun',
      isPublicRoute
    })
    
    // Si c'est une route publique ou si l'utilisateur est connecté, autoriser l'accès
    if (isPublicRoute || session) {
      console.log('✅ Accès autorisé pour:', request.nextUrl.pathname)
      return response
    }
    
    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    // Stocker l'URL actuelle pour rediriger après la connexion
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    
    console.log('🔄 Redirection vers:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('💥 Erreur dans le middleware:', error)
    return response
  }
}

// Spécifier les routes à protéger
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 