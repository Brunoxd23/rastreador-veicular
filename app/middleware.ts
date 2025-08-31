import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const isAuthPage = request.nextUrl.pathname === '/login';
  const isPublicPage = 
    request.nextUrl.pathname === '/create-admin' ||
    request.nextUrl.pathname === '/forgot-password' ||
    request.nextUrl.pathname === '/reset-password';

  // Se for uma página pública, permite o acesso
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Se não tiver token e não estiver na página de login, redireciona para login
  if (!token && !isAuthPage) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token'); // Limpa o cookie inválido se existir
    return response;
  }

  // Se tiver token e estiver tentando acessar a página de login, redireciona para dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Verifica as permissões baseadas no role para rotas protegidas
  if (token && !isAuthPage) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET || '') as { userId: string, role: string };
      const { role } = decoded;

      // Rotas administrativas - apenas admin
      if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Rotas de usuários - apenas admin e funcionario
      if (request.nextUrl.pathname.startsWith('/usuarios') && role === 'client') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Rotas de veículos - apenas admin e funcionario
      if (request.nextUrl.pathname.startsWith('/veiculos') && role === 'client') {
        return NextResponse.redirect(new URL('/meus-veiculos', request.url));
      }

      // Rotas de tickets - todos podem acessar, mas com diferentes visões
      if (request.nextUrl.pathname.startsWith('/tickets')) {
        if (role === 'client') {
          // Cliente só pode ver seus próprios tickets
          return NextResponse.next();
        }
      }

      // Rotas financeiras - apenas admin
      if (request.nextUrl.pathname.startsWith('/financeiro') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Rotas de configurações - apenas admin
      if (request.nextUrl.pathname.startsWith('/configuracoes') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      // Se houver erro na verificação do token, redireciona para login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Em todos os outros casos, permite o acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/usuarios/:path*',
    '/veiculos/:path*',
    '/tickets/:path*',
    '/financeiro/:path*',
    '/configuracoes/:path*',
    '/admin/:path*',
    '/meus-veiculos/:path*',
    '/login',
    '/create-admin',
    '/forgot-password',
    '/reset-password',
  ],
}; 