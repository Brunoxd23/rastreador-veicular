import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/database";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuário não encontrado",
        },
        { status: 400 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Senha incorreta",
        },
        { status: 400 }
      );
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Login realizado com sucesso!",
        token,
        user: userData,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict`,
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Erro no servidor",
      },
      { status: 500 }
    );
  }
}
