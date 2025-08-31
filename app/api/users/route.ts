import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import bcrypt from "bcryptjs";

type UserRole = "admin" | "funcionario" | "client";

// GET - Listar usuários
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };

      // Buscar usuário autenticado
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: Number(decoded.userId) },
      });

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Verificar se o usuário tem permissão para listar usuários
      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.role !== "funcionario"
      ) {
        return NextResponse.json(
          { error: "Sem permissão para listar usuários" },
          { status: 403 }
        );
      }

      // Verificar se há filtro por role
      const { searchParams } = new URL(request.url);
      const roleFilter = searchParams.get("role");

      // Construir query
      const where = roleFilter ? { role: roleFilter } : {};

      // Buscar usuários
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({ success: true, users });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    );
  }
}

// POST - Criar usuário
export async function POST(req: Request) {
  try {
    // Verificar token JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    const data = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: Number(decoded.userId) },
      });

      if (
        !authenticatedUser ||
        (authenticatedUser.role !== "admin" &&
          authenticatedUser.role !== "funcionario")
      ) {
        return NextResponse.json(
          {
            error: "Apenas administradores e funcionários podem criar usuários",
          },
          { status: 403 }
        );
      }

      // Validar dados obrigatórios
      if (!data.name || !data.email || !data.password || !data.role) {
        return NextResponse.json(
          { error: "Todos os campos são obrigatórios" },
          { status: 400 }
        );
      }

      // Validar permissões de role
      if (authenticatedUser.role === "funcionario" && data.role !== "client") {
        return NextResponse.json(
          { error: "Funcionários só podem criar clientes" },
          { status: 403 }
        );
      }

      // Verificar se o email já existe no Prisma
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 400 }
        );
      }
      // Hash da senha
      const hashedPassword = await bcrypt.hash(data.password, 10);
      // Criar usuário no Prisma
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ success: true, user });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    const data = await req.json();

    // Verificar token JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: Number(decoded.userId) },
      });

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Verificar se o usuário existe no Prisma
      const existingUser = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Validações de permissão
      if (authenticatedUser.role === "funcionario") {
        if (existingUser.role === "admin") {
          return NextResponse.json(
            { error: "Funcionários não podem editar administradores" },
            { status: 403 }
          );
        }

        if (data.role && !["client", "funcionario"].includes(data.role)) {
          return NextResponse.json(
            {
              error:
                "Funcionários só podem definir usuários como cliente ou funcionário",
            },
            { status: 403 }
          );
        }
      } else if (authenticatedUser.role === "client") {
        return NextResponse.json(
          { error: "Clientes não podem editar usuários" },
          { status: 403 }
        );
      }

      // Validar o role
      if (
        data.role &&
        !["admin", "funcionario", "client"].includes(data.role)
      ) {
        return NextResponse.json(
          { error: "Tipo de usuário inválido" },
          { status: 400 }
        );
      }

      // Se estiver atualizando o email, verificar se já existe
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailExists) {
          return NextResponse.json(
            { error: "Email já cadastrado" },
            { status: 400 }
          );
        }
      }

      // Preparar dados para atualização
      const updateData: any = {
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      };

      // Definir o role baseado nas permissões
      if (data.role) {
        if (authenticatedUser.role === "admin") {
          updateData.role = data.role;
        } else if (
          authenticatedUser.role === "funcionario" &&
          ["client", "funcionario"].includes(data.role)
        ) {
          updateData.role = data.role;
        }
      }

      // Se houver senha nova, fazer o hash
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      // Atualizar no Prisma
      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
      console.log("Usuário atualizado:", updatedUser);
      return NextResponse.json({ success: true, user: updatedUser });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao atualizar usuário",
      },
      { status: 500 }
    );
  }
}

// DELETE - Excluir usuário
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }

    // Verificar token JWT
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    console.log("Token recebido:", token?.value ? "Presente" : "Ausente");
    console.log("Token completo:", token);

    if (!token?.value) {
      return NextResponse.json(
        { error: "Token não encontrado" },
        { status: 401 }
      );
    }

    try {
      // Verificar e decodificar o token
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };
      console.log("Token decodificado:", decoded);
      console.log("JWT_SECRET presente:", !!process.env.JWT_SECRET);

      // Buscar usuário autenticado
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: Number(decoded.userId) },
      });

      console.log("Usuário autenticado:", authenticatedUser);

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Verificar se é admin
      if (authenticatedUser.role !== "admin") {
        return NextResponse.json(
          { error: "Apenas administradores podem excluir usuários" },
          { status: 403 }
        );
      }

      // Buscar o usuário a ser excluído no Prisma
      const userToDelete = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      console.log("Usuário a ser excluído:", userToDelete);

      if (!userToDelete) {
        return NextResponse.json(
          { error: "Usuário não encontrado no Prisma" },
          { status: 404 }
        );
      }

      try {
        // Primeiro atualiza os tickets que referenciam este usuário
        await prisma.ticket.updateMany({
          where: {
            OR: [{ userId: Number(id) }, { assigneeId: Number(id) }],
          },
          data: {
            assigneeId: null,
          },
        });

        // Depois exclui o usuário no Prisma
        await prisma.user.delete({
          where: { id: Number(id) },
        });

        console.log("Usuário excluído com sucesso do Prisma");

        return NextResponse.json({
          success: true,
          message: "Usuário excluído com sucesso",
        });
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        return NextResponse.json(
          { error: "Erro ao excluir usuário" },
          { status: 500 }
        );
      }
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
