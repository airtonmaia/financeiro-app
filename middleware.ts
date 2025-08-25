// middleware.ts
// Este middleware protege as rotas da sua aplicação.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`\n--- [Middleware] Nova Requisição: ${request.method} ${request.nextUrl.pathname}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Corrigido: Use as variáveis de ambiente do lado do servidor, sem o prefixo NEXT_PUBLIC_
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    console.log('[Middleware] Utilizador encontrado:', user.email);
  } else {
    console.log('[Middleware] Nenhum utilizador encontrado.');
  }

  // A rota /public/board é acessível sem autenticação
  if (request.nextUrl.pathname.startsWith('/public/board')) {
    console.log('[Middleware] Permitindo acesso à visualização pública do quadro...');
    return response;
  }

  // Se o usuário não estiver logado e tentar acessar uma rota protegida
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('[Middleware] Acesso negado ao dashboard. Redirecionando para /auth/login...');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Se o usuário estiver logado e tentar acessar as páginas de login/cadastro
  if (user && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/signup'))) {
    console.log('[Middleware] Utilizador já logado. Redirecionando para /dashboard...');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  console.log('[Middleware] Nenhuma regra de redirecionamento aplicada. Deixando a requisição passar.');
  return response
}

// Configuração para definir quais rotas o middleware deve observar
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as que começam com:
     * - _next/static (ficheiros estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico (ficheiro de ícone)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
