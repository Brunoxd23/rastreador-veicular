import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Ticket {
  status: string;
}

export async function GET() {
  try {
    // Buscar todas as estatísticas em paralelo
    const [users, vehicles, tickets] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.ticket.findMany({
        select: {
          status: true
        }
      })
    ]);

    // Calcular tickets abertos
    const openTickets = tickets.filter((ticket: Ticket) => ticket.status === 'aberto').length;

    return NextResponse.json({
      totalUsers: users,
      totalVehicles: vehicles,
      totalTickets: tickets.length,
      openTickets: openTickets,
      totalInvoices: 0 // Placeholder para quando implementar faturas
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
} 