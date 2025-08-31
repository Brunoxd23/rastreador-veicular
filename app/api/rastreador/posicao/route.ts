// app/api/rastreador/posicao/route.ts
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const imei = req.nextUrl.searchParams.get("imei");
  if (!imei) {
    return new Response(
      JSON.stringify({ success: false, error: "IMEI não informado" }),
      { status: 400 }
    );
  }
  const rastreador = await prisma.rastreador.findUnique({
    where: { identificador: imei },
    include: { posicoes: { orderBy: { dataRecebida: "desc" }, take: 1 } },
  });
  if (!rastreador || rastreador.posicoes.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: "Posição não encontrada" }),
      { status: 404 }
    );
  }
  const pos = rastreador.posicoes[0];
  return new Response(
    JSON.stringify({ success: true, lat: pos.latitude, lng: pos.longitude }),
    { status: 200 }
  );
}
