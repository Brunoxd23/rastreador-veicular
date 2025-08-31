import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Contagem de usuários
    const totalUsers = await prisma.user.count();
    // Contagem de veículos
    const totalVehicles = await prisma.vehicle.count();
    // Contagem de faturas
    const totalInvoices = await prisma.fatura.count();
    // Contagem de tickets
    const totalTickets = await prisma.ticket.count();
    // Contagem de tickets em aberto
    const openTickets = await prisma.ticket.count({
      where: { status: "aberto" },
    });
    // Contagem de tickets fechados
    const closedTickets = await prisma.ticket.count({
      where: { status: "fechado" },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalVehicles,
        totalInvoices,
        totalTickets,
        openTickets,
        closedTickets,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error),
      },
      { status: 500 }
    );
  }
}
