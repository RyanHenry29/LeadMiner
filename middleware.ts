import { updateSession } from '@/lib/supabase/proxy'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Rotas públicas (não precisam de autenticação)
const publicRoutes = ['/', '/auth/login', '/auth/sign-up', '/auth/sign-up-success', '/auth/error', '/auth/callback', '/auth/forgot-password', '/planos', '/termos', '/privacidade']

// Email do admin unico
const ADMIN_EMAIL = 'ryanhenry.gomes@gmail.com'

// Rotas que apenas o admin pode acessar
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  // Primeiro, atualiza a sessão
  const response = await updateSession(request)
  
  const { pathname } = request.nextUrl
  
  // Ignora rotas de API e arquivos estáticos
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return response
  }
  
  // Verifica se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith('/auth/')
  )
  
  if (isPublicRoute) {
    return response
  }
  
  // Para rotas protegidas, verifica se o usuário está autenticado
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se não está autenticado, redireciona para login
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Verifica se é uma rota admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (isAdminRoute) {
    // Verifica se e o admin unico pelo email
    if (user.email !== ADMIN_EMAIL) {
      // Redireciona para dashboard se não for o admin
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
