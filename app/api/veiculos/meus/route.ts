import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  // Permite visualizar veículos client sem token, via query string ?userId=2
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: "userId não informado" }),
      { status: 400 }
    );
  }
  const veiculos = await prisma.vehicle.findMany({
    where: { user: { id: Number(userId) } },
    select: {
      id: true,
      plate: true,
      model: true,
      brand: true,
      year: true,
      rastreadores: {
        select: {
          id: true,
          modelo: true,
          identificador: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return new Response(JSON.stringify({ success: true, veiculos }), {
    status: 200,
  });
}
