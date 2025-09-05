// API mock para status do rastreador
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const imei = request.nextUrl.searchParams.get("imei");
  if (!imei) {
    return Response.json(
      { success: false, error: "IMEI não informado" },
      { status: 400 }
    );
  }
  const rastreador = await prisma.rastreador.findUnique({
    where: { identificador: imei },
    include: {
      posicoes: {
        orderBy: { dataRecebida: "desc" },
        take: 1,
        select: {
          id: true,
          dataRecebida: true,
          rastreadorId: true,
          latitude: true,
          longitude: true,
          bateria: true, // Ensure bateria is selected
        },
      },
    },
  });
  if (!rastreador) {
    return Response.json(
      { success: false, error: "Rastreador não encontrado" },
      { status: 404 }
    );
  }
  // Status: ativo = ligado, bloqueado = desligado
  const ligado = rastreador.status === "ativo";
  // Bateria: valor real da última posição, se disponível
  const bateriaRaw = rastreador.posicoes[0]?.bateria;
  const bateria =
    bateriaRaw !== undefined && bateriaRaw !== null ? `${bateriaRaw}%` : "N/A";
  const ultimaAtualizacao =
    rastreador.posicoes[0]?.dataRecebida?.toISOString() || null;
  return Response.json({
    success: true,
    status: {
      bateria,
      ligado,
      ultimaAtualizacao,
    },
  });
}
