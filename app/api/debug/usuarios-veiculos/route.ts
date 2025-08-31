import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // Lista todos os usuários e veículos com userId
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      plate: true,
      model: true,
      brand: true,
      year: true,
      userId: true,
    },
  });
  return NextResponse.json({ users, vehicles });
}
