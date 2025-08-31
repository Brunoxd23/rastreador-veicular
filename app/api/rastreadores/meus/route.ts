import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Recupera o usuário logado pelo token JWT
  const auth = req.headers.get("authorization");
  if (!auth) {
    return new Response(JSON.stringify({ success: false, error: "Não autenticado" }), { status: 401 });
  }
  const token = auth.replace("Bearer ", "");
  // Decodifique o token para obter o id do usuário
  const jwt = require('jsonwebtoken');
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Token inválido" }), { status: 401 });
  }
  // Busca rastreadores vinculados ao usuário
  const rastreadores = await prisma.rastreador.findMany({
    where: { userId },
    select: { id: true, modelo: true, identificador: true },
  });
  return new Response(JSON.stringify({ success: true, rastreadores }), { status: 200 });
}
