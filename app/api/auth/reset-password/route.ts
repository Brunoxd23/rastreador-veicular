import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca o usuário pelo token e verifica se o token não expirou
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // Atualiza a senha e remove o token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password, // hash a senha antes se necessário!
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
