import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../utils/database";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Busca o usuário pelo Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    // Verifica a senha usando bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Senha incorreta" },
        { status: 400 }
      );
    }
    // Gera o token JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );
    // Remove a senha do objeto do usuário antes de enviar
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "client",
    };

    // Cria a resposta
    const response = NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      user: userWithoutPassword,
    });

    // Configura o cookie com o token
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 1 dia
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar login" },
      { status: 500 }
    );
  }
}
