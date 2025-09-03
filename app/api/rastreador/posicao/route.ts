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
    // Mock: Rua Marajó 166, Embu das Artes, Jardim das Oliveiras, CEP 06817230
    // Coordenadas aproximadas: lat -23.6485, lng -46.8526
    return new Response(
      JSON.stringify({
        success: true,
        lat: -23.6485,
        lng: -46.8526,
        mock: true,
        message:
          "Posição real ainda não carregada. Mostrando localização padrão: Rua Marajó 166, Embu das Artes, Jardim das Oliveiras. Assim que o rastreador enviar sinal, o mapa será atualizado automaticamente.",
      }),
      { status: 200 }
    );
  }
  const pos = rastreador.posicoes[0];
  return new Response(
    JSON.stringify({ success: true, lat: pos.latitude, lng: pos.longitude }),
    { status: 200 }
  );
}
