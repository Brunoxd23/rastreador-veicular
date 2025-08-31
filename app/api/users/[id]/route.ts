import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../utils/database";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";

async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return null;
  try {
    const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
      userId: string;
    };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json(
      { message: "Token inválido ou ausente" },
      { status: 401 }
    );
  }
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { message: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json(
      { message: "Token inválido ou ausente" },
      { status: 401 }
    );
  }
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    const { name, email, password, isAdmin } = body;

    // Verifica se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!existingUser) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se o email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const userWithEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (userWithEmail && userWithEmail.id !== Number(id)) {
        return NextResponse.json(
          { message: "Email já está em uso por outro usuário" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (isAdmin !== undefined) updateData.role = isAdmin ? "admin" : "client";
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromToken();
  if (!userId) {
    return NextResponse.json(
      { message: "Token inválido ou ausente" },
      { status: 401 }
    );
  }
  try {
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { message: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
