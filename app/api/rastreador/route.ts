import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Espera: modelo, identificador, numeroChip, status, vehicleId, userId
    const {
      modelo,
      identificador,
      numeroChip,
      status = "ativo",
      vehicleId,
      userId,
    } = body;
    if (!modelo || !identificador || !numeroChip || !vehicleId || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Dados obrigatórios ausentes",
        }),
        { status: 400 }
      );
    }
    if (typeof numeroChip !== "string" || numeroChip.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Número do chip inválido",
        }),
        { status: 400 }
      );
    }
    // Cria rastreador vinculado ao veículo e usuário
    const rastreador = await prisma.rastreador.create({
      data: {
        modelo,
        identificador,
        numeroChip,
        status,
        vehicle: { connect: { id: vehicleId } },
        user: { connect: { id: userId } },
      },
    });
    return new Response(JSON.stringify({ success: true, rastreador }), {
      status: 201,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao cadastrar rastreador" }),
      { status: 500 }
    );
  }
}
