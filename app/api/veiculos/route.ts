// POST - Cadastrar veículo
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    try {
      verify(token.value, process.env.JWT_SECRET || "");
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    const body = await request.json();
    const { plate, model, brand, year, userId } = body;
    if (!plate || !model || !brand || !year || !userId) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }
    const exists = await prisma.vehicle.findUnique({ where: { plate } });
    if (exists) {
      return NextResponse.json(
        { error: "Placa já cadastrada" },
        { status: 400 }
      );
    }
    const vehicle = await prisma.vehicle.create({
      data: { plate, model, brand, year, userId },
    });
    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao cadastrar veículo" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";

// GET - Listar veículos
export async function GET(request: Request) {
  try {
    // Exige autenticação JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    let userId;
    let userRole = "client";
    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string | number;
        role?: string;
      };
      console.log("[DEBUG] decoded JWT:", decoded);
      userId =
        typeof decoded.userId === "number"
          ? decoded.userId
          : Number(decoded.userId);
      if (decoded.role) userRole = decoded.role;
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    let where = {};
    if (userRole !== "admin") {
      where = { userId };
    }
    const vehicles = await prisma.vehicle.findMany({
      where,
      select: {
        id: true,
        plate: true,
        model: true,
        brand: true,
        year: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      "[DEBUG] userRole:",
      userRole,
      "userId:",
      userId,
      "vehicles.length:",
      vehicles.length,
      "vehicles:",
      vehicles
    );
    return NextResponse.json({ success: true, vehicles });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar veículos" },
      { status: 500 }
    );
  }
}
