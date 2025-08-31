import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

interface Employee {
  id: string;
  name: string;
  email: string;
}

// GET - Listar tickets
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
      userId: string;
      role: string;
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

    let whereClause = {};

    // Filtrar tickets baseado no role do usuário
    if (authenticatedUser.role === "admin") {
      whereClause = {};
    } else if (authenticatedUser.role === "funcionario") {
      whereClause = {
        OR: [{ assigneeId: authenticatedUser.id }, { assigneeId: null }],
      };
    } else {
      whereClause = {
        userId: authenticatedUser.id,
      };
    }

    // Buscar tickets com o filtro apropriado
    let tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Garante que resolution nunca seja undefined ou null
    tickets = tickets.map((t) => ({ ...t, resolution: t.resolution ?? "" }));

    // Se for admin, buscar lista de funcionários disponíveis
    let availableEmployees: Employee[] = [];
    if (authenticatedUser.role === "admin") {
      const employees = await prisma.user.findMany({
        where: { role: "funcionario" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      availableEmployees = employees.map((e) => ({
        id: String(e.id),
        name: e.name,
        email: e.email,
      }));
    }

    return NextResponse.json({
      success: true,
      tickets,
      availableEmployees:
        authenticatedUser.role === "admin" ? availableEmployees : undefined,
    });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tickets" },
      { status: 500 }
    );
  }
}

// POST - Criar ticket
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    const data = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
      userId: string;
      role: string;
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

    // Validar dados obrigatórios
    if (!data.titulo && !data.title) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    if (!data.descricao && !data.description) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      );
    }

    // Criar ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: data.titulo || data.title,
        description: data.descricao || data.description,
        status: "aberto",
        priority: data.prioridade || data.priority || "baixa",
        userId: Number(decoded.userId),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao criar ticket" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar ticket
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const data = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID do ticket não fornecido" },
        { status: 400 }
      );
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
        role: string;
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

      // Buscar ticket atual
      const currentTicket = await prisma.ticket.findUnique({
        where: { id: Number(id) },
      });

      if (!currentTicket) {
        return NextResponse.json(
          { error: "Ticket não encontrado" },
          { status: 404 }
        );
      }

      // Preparar dados para atualização
      const updateData: any = {};

      // Regras de atualização baseadas no role
      switch (authenticatedUser.role) {
        case "admin":
          // Admin pode atualizar tudo
          if (data.title) updateData.title = data.title;
          if (data.description) updateData.description = data.description;
          if (data.status) updateData.status = data.status;
          if (data.priority) updateData.priority = data.priority;
          if (data.assigneeId !== undefined) {
            // Verificar se o assigneeId é de um funcionário válido
            if (data.assigneeId) {
              const employee = await prisma.user.findFirst({
                where: {
                  id: data.assigneeId,
                  role: "funcionario",
                },
              });
              if (!employee) {
                return NextResponse.json(
                  { error: "Funcionário não encontrado" },
                  { status: 404 }
                );
              }
            }
            updateData.assigneeId = data.assigneeId;
            updateData.status = data.assigneeId ? "em_andamento" : "aberto";
          }
          if (data.resolution) updateData.resolution = data.resolution;
          break;

        case "funcionario":
          // Funcionário só pode atualizar tickets atribuídos a ele
          if (currentTicket.assigneeId !== Number(decoded.userId)) {
            return NextResponse.json(
              { error: "Você só pode atualizar tickets atribuídos a você" },
              { status: 403 }
            );
          }
          // Pode atualizar status e adicionar resolução
          if (data.status) {
            if (!["em_andamento", "resolvido"].includes(data.status)) {
              return NextResponse.json(
                { error: "Status inválido para funcionário" },
                { status: 400 }
              );
            }
            updateData.status = data.status;
          }
          if (data.resolution) updateData.resolution = data.resolution;
          break;

        case "client":
          // Cliente só pode atualizar seus próprios tickets e apenas quando estiverem abertos
          if (currentTicket.userId !== Number(decoded.userId)) {
            return NextResponse.json(
              { error: "Você só pode atualizar seus próprios tickets" },
              { status: 403 }
            );
          }
          if (currentTicket.status !== "aberto") {
            return NextResponse.json(
              { error: "Você só pode atualizar tickets abertos" },
              { status: 403 }
            );
          }
          // Pode atualizar apenas título e descrição
          if (data.title) updateData.title = data.title;
          if (data.description) updateData.description = data.description;
          break;

        default:
          return NextResponse.json({ error: "Role inválido" }, { status: 400 });
      }

      // Atualizar data de modificação
      updateData.updatedAt = new Date();

      // Atualizar ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
          assignee: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Sincronizar com MongoDB
      const mongoClient = new MongoClient(process.env.MONGODB_URI || "");
      await mongoClient.connect();
      const db = mongoClient.db("my_database");
      const ticketsCollection = db.collection("tickets");

      const mongoTicket = {
        _id: new ObjectId(updatedTicket.id),
        ...updateData,
        user: updatedTicket.user,
        assignee: updatedTicket.assignee,
      };

      await ticketsCollection.updateOne(
        { _id: mongoTicket._id },
        { $set: mongoTicket },
        { upsert: true }
      );

      await mongoClient.close();

      return NextResponse.json({ success: true, ticket: updatedTicket });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir ticket
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "ID do ticket não fornecido" },
        { status: 400 }
      );
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
        role: string;
      };

      // Apenas admin pode excluir tickets
      if (decoded.role !== "admin") {
        return NextResponse.json(
          { error: "Apenas administradores podem excluir tickets" },
          { status: 403 }
        );
      }

      // Excluir mensagens do ticket primeiro
      await prisma.message.deleteMany({
        where: { ticketId: Number(id) },
      });

      // Depois excluir o ticket
      await prisma.ticket.delete({
        where: { id: Number(id) },
      });

      return NextResponse.json({
        success: true,
        message: "Ticket excluído com sucesso",
      });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao excluir ticket:", error);
    return NextResponse.json(
      { error: "Erro ao excluir ticket" },
      { status: 500 }
    );
  }
}
