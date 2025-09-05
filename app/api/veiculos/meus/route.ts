import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  // Exige autenticação JWT e retorna apenas veículos do usuário autenticado
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token?.value) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }
  let userId;
  try {
    const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
      userId: string | number;
    };
    userId =
      typeof decoded.userId === "number"
        ? decoded.userId
        : Number(decoded.userId);
  } catch {
    return NextResponse.json(
      { success: false, error: "Token inválido" },
      { status: 401 }
    );
  }
  const veiculos = await prisma.vehicle.findMany({
    where: { user: { id: userId } },
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
  return NextResponse.json({ success: true, veiculos });
}
