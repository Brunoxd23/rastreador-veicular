import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwtToken } from "@/lib/jwt";

function isValidIMEI(imei: string) {
  return /^\d{15}$/.test(imei);
}

// GET - Verifica duplicidade ou executa lógica de bloqueio
export async function GET(req: NextRequest) {
  const identificador = req.nextUrl.searchParams.get("identificador");
  if (identificador) {
    if (!isValidIMEI(identificador)) {
      return NextResponse.json(
        { error: "Identificador inválido." },
        { status: 400 }
      );
    }
    const exists = await prisma.rastreador.findUnique({
      where: { identificador },
    });
    return NextResponse.json({ exists: !!exists });
  }
  // Lógica de bloqueio automática
  try {
    // Busca rastreadores com licença vencida e não paga
    const bloqueaveis = await prisma.rastreador.findMany({
      where: {
        licencas: {
          some: {
            status: "pendente",
            dataVencimento: { lt: new Date() },
          },
        },
        status: "ativo",
      },
    });
    // Bloqueia rastreadores inadimplentes
    for (const rastreador of bloqueaveis) {
      await prisma.rastreador.update({
        where: { id: rastreador.id },
        data: { status: "bloqueado" },
      });
    }
    return NextResponse.json({ bloqueados: bloqueaveis.map((r) => r.id) });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao bloquear rastreadores." },
      { status: 500 }
    );
  }
}

// Cadastro de rastreador, associação com veículo e usuário, e geração automática de licença
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      modelo,
      identificador,
      vehicleId,
      userId,
      valorLicenca,
      dataVencimento,
    } = body;
    // Validações robustas
    if (!modelo || typeof modelo !== "string" || modelo.length < 2) {
      return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
    }
    if (!identificador || !isValidIMEI(identificador)) {
      return NextResponse.json(
        { error: "Identificador deve conter 15 dígitos numéricos." },
        { status: 400 }
      );
    }
    const exists = await prisma.rastreador.findUnique({
      where: { identificador },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Identificador já cadastrado." },
        { status: 400 }
      );
    }
    if (!vehicleId || typeof vehicleId !== "number") {
      return NextResponse.json({ error: "Veículo inválido." }, { status: 400 });
    }
    if (!userId || typeof userId !== "number") {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }
    if (
      !valorLicenca ||
      typeof valorLicenca !== "number" ||
      valorLicenca <= 0
    ) {
      return NextResponse.json(
        { error: "Valor da licença inválido." },
        { status: 400 }
      );
    }
    if (!dataVencimento || isNaN(Date.parse(dataVencimento))) {
      return NextResponse.json(
        { error: "Data de vencimento inválida." },
        { status: 400 }
      );
    }
    // Cria rastreador
    const rastreador = await prisma.rastreador.create({
      data: {
        modelo,
        identificador,
        vehicleId,
        userId,
      },
    });
    // Cria licença/fatura vinculada ao rastreador
    await prisma.licenca.create({
      data: {
        rastreadorId: rastreador.id,
        valor: valorLicenca,
        status: "pendente",
        dataVencimento: new Date(dataVencimento),
      },
    });
    return NextResponse.json({ success: true, rastreadorId: rastreador.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao cadastrar rastreador." },
      { status: 500 }
    );
  }
}
