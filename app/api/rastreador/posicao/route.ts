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
    // Mock: Rua Ilha Cumprida 283, Parque Esplanada, Embu das Artes, CEP 06817180
    // Coordenadas aproximadas: lat -23.64655, lng -46.84985
    return new Response(
      JSON.stringify({
        success: true,
        lat: -23.64655,
        lng: -46.84985,
        mock: true,
        message:
          "Posição real ainda não carregada. Mostrando localização padrão: Rua Ilha Cumprida 283, Parque Esplanada, Embu das Artes. Assim que o rastreador enviar sinal, o mapa será atualizado automaticamente.",
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
