import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // PROVA DE VIDA AQUI:
  console.log('🔥 O LEÃO DE CHÁCARA ACORDOU NA ROTA:', request.nextUrl.pathname);

  const { pathname } = request.nextUrl;

  // Evitar interceptar rotas públicas e recursos estáticos
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/teladelogin') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // O middleware do Next.js roda no Edge Server, logo ele só tem acesso aos Cookies, 
  // não ao localStorage do navegador. Validamos a sessão pelos cookies.
  const token = request.cookies.get('access_token')?.value || request.cookies.get('elevva_guest_id')?.value;

  if (!token) {
    // Redireciona o usuário para a tela de login (que está na pasta /teladelogin ou /login)
    // Estamos usando o caminho real da sua tela de login: /teladelogin
    const loginUrl = new URL('/teladelogin', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Interceptar apenas as rotas protegidas especificadas
  matcher: ['/dashboard/:path*', '/kanban/:path*', '/configuracoes/:path*']
};
