import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token não encontrado no cookie" },
        { status: 401 }
      );
    }
    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "");
      return NextResponse.json({ success: true, decoded });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao validar token" },
      { status: 500 }
    );
  }
}
