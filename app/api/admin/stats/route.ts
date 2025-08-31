import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJwtToken } from '@/lib/jwt';
import { JwtPayload } from 'jsonwebtoken';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
  role?: string;
}

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Verificar o token
    const token = request.headers.get('auth_token');
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Token não fornecido' }),
        { status: 401 }
      );
    }

    const decoded = verifyJwtToken(token) as CustomJwtPayload;
    if (!decoded || !decoded.role || decoded.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { status: 403 }
      );
    }

    // Buscar estatísticas
    const [totalUsers, totalVehicles, totalTickets] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.ticket.count()
    ]);

    // Por enquanto, vamos retornar 0 para receita total
    // Em uma implementação real, isso seria calculado com base em dados financeiros
    const totalRevenue = 0;

    return new NextResponse(
      JSON.stringify({
        success: true,
        stats: {
          totalUsers,
          totalVehicles,
          totalTickets,
          totalRevenue
        }
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erro ao buscar estatísticas' }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 