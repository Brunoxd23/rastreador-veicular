import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

// Utilitário para obter o usuário autenticado via cookie JWT
async function getUserIdFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return null;
  try {
    const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
      userId: string | number;
    };
    return typeof decoded.userId === "number"
      ? decoded.userId
      : Number(decoded.userId);
  } catch {
    return null;
  }
}

// Garante que todo rastreador ativo do usuário tenha sempre uma fatura do próximo mês
async function garantirFaturaProximoMes(userId: number) {
  // Busca rastreadores ativos do usuário
  const rastreadores = await prisma.rastreador.findMany({
    where: { status: "ativo", userId },
  });
  for (const rastreador of rastreadores) {
    // Busca todas as faturas desse rastreador
    const faturas = await prisma.fatura.findMany({
      where: { userId, rastreadorId: rastreador.id },
      orderBy: { dataVencimento: "desc" },
    });
    if (!faturas || faturas.length === 0) {
      // Se não existe nenhuma fatura, cria a primeira com vencimento para hoje
      await prisma.fatura.create({
        data: {
          userId,
          rastreadorId: rastreador.id,
          valor: 39.9, // valor padrão, ajuste conforme necessário
          status: "pendente",
          dataVencimento: new Date(),
        },
      });
      continue;
    }
    // Só gera nova fatura se TODAS as anteriores estiverem pagas
    const existeNaoPaga = faturas.some((f) => f.status !== "paga");
    if (existeNaoPaga) {
      continue;
    }
    // Última fatura paga
    const ultimaFatura = faturas[0];
    const proximoVencimento = new Date(ultimaFatura.dataVencimento);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    // Só cria se NÃO existir nenhuma fatura para o mesmo mês/ano
    const existeProxima = await prisma.fatura.findFirst({
      where: {
        userId,
        rastreadorId: rastreador.id,
        AND: [
          {
            dataVencimento: {
              gte: new Date(
                proximoVencimento.getFullYear(),
                proximoVencimento.getMonth(),
                1
              ),
            },
          },
          {
            dataVencimento: {
              lt: new Date(
                proximoVencimento.getFullYear(),
                proximoVencimento.getMonth() + 1,
                1
              ),
            },
          },
        ],
      },
    });
    if (!existeProxima) {
      await prisma.fatura.create({
        data: {
          userId,
          rastreadorId: rastreador.id,
          valor: ultimaFatura.valor,
          status: "pendente",
          dataVencimento: proximoVencimento,
        },
      });
    }
  }
}

// GET - Listar faturas do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verifica token e papel do usuário
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
      userId =
        typeof decoded.userId === "number"
          ? decoded.userId
          : Number(decoded.userId);
      if (decoded.role) userRole = decoded.role;
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    // Admin vê todas as faturas, outros só as próprias
    let where = {};
    if (userRole !== "admin") {
      where = { userId };
    }
    // Garante que a próxima fatura existe para todos os rastreadores ativos do usuário
    await garantirFaturaProximoMes(userId);
    // Busca todas as faturas
    const faturas = await prisma.fatura.findMany({
      where,
      select: {
        id: true,
        valor: true,
        status: true,
        dataEmissao: true,
        dataVencimento: true,
        rastreador: {
          select: {
            identificador: true,
            modelo: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dataVencimento: "asc" },
    });
    return NextResponse.json({ success: true, faturas });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar faturas" },
      { status: 500 }
    );
  }
}
