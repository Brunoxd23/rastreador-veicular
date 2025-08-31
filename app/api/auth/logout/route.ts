import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Limpa o cookie de autenticação
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');

    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao fazer logout' },
      { status: 500 }
    );
  }
} 