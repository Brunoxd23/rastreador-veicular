import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../utils/database";
import { verify } from "jsonwebtoken";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      console.log("Token não encontrado");
      return NextResponse.json({ user: null });
    }

    try {
      // Verifica o token
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };

      // Busca o usuário pelo Prisma
      const user = await prisma.user.findUnique({
        where: {
          id:
            typeof decoded.userId === "number"
              ? decoded.userId
              : Number(decoded.userId),
        },
      });
      if (!user) {
        console.log("Usuário não encontrado com o ID:", decoded.userId);
        const response = NextResponse.json({ user: null });
        response.cookies.delete("auth_token");
        return response;
      }
      console.log("Usuário autenticado:", {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      // Retorna os dados do usuário com o role correto
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "client",
        },
      });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      const response = NextResponse.json({ user: null });
      response.cookies.delete("auth_token");
      return response;
    }
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return NextResponse.json({ user: null });
  }
}
