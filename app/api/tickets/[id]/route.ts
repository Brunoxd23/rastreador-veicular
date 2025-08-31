import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

// GET - Buscar ticket específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
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
        where: { id: parseInt(decoded.userId, 10) },
      });

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Buscar ticket no Prisma
      const ticketId =
        typeof awaitedParams.id === "string"
          ? parseInt(awaitedParams.id, 10)
          : awaitedParams.id;
      if (isNaN(ticketId)) {
        return NextResponse.json(
          { error: "ID do ticket inválido" },
          { status: 400 }
        );
      }
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          messages: {
            orderBy: {
              data: "asc",
            },
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        // Se não encontrou no Prisma, tentar buscar no MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI || "");
        const db = client.db();
        const ticketsCollection = db.collection("tickets");

        const mongoTicket = await ticketsCollection.findOne({
          _id: new ObjectId(awaitedParams.id),
        });

        await client.close();

        if (mongoTicket) {
          // Se encontrou no MongoDB, criar no Prisma
          const prismaTicket = await prisma.ticket.create({
            data: {
              id:
                typeof mongoTicket._id === "number"
                  ? mongoTicket._id
                  : parseInt(mongoTicket._id.toString(), 10),
              title: mongoTicket.title || mongoTicket.titulo,
              description: mongoTicket.description || mongoTicket.descricao,
              status: mongoTicket.status,
              priority: mongoTicket.priority || mongoTicket.prioridade,
              userId: mongoTicket.userId || mongoTicket.cliente,
              assigneeId: mongoTicket.assigneeId || mongoTicket.atendente,
              createdAt: new Date(mongoTicket.createdAt),
              updatedAt: new Date(
                mongoTicket.updatedAt || mongoTicket.createdAt
              ),
              resolution: mongoTicket.resolution,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              messages: true,
            },
          });

          return NextResponse.json({ ticket: prismaTicket });
        }

        return NextResponse.json(
          { error: "Ticket não encontrado" },
          { status: 404 }
        );
      }

      // Verificar permissões
      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.role !== "funcionario" &&
        ticket.userId !== authenticatedUser.id
      ) {
        return NextResponse.json(
          { error: "Sem permissão para visualizar este ticket" },
          { status: 403 }
        );
      }

      // Mapear mensagens para o formato esperado pelo frontend
      const mappedTicket = ticket
        ? {
            ...ticket,
            messages: (ticket.messages ?? []).map((msg) => ({
              id: msg.id,
              content: msg.texto,
              userId: msg.autor,
              ticketId: msg.ticketId,
              data: msg.data,
              user: msg.user ? { name: msg.user.name } : null,
            })),
          }
        : null;
      return NextResponse.json({ success: true, ticket: mappedTicket });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ticket" },
      { status: 500 }
    );
  }
}

// POST - Adicionar mensagem ao ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    const data = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const decoded = verify(token.value, process.env.JWT_SECRET || "") as {
        userId: string;
      };

      // Buscar usuário autenticado
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: parseInt(decoded.userId, 10) },
      });

      if (!authenticatedUser) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      // Buscar ticket
      const ticketId =
        typeof awaitedParams.id === "string"
          ? parseInt(awaitedParams.id, 10)
          : awaitedParams.id;
      if (isNaN(ticketId)) {
        return NextResponse.json(
          { error: "ID do ticket inválido" },
          { status: 400 }
        );
      }
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          user: true,
          assignee: true,
          messages: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket não encontrado" },
          { status: 404 }
        );
      }

      // Verificar permissões
      if (
        authenticatedUser.role !== "admin" &&
        authenticatedUser.role !== "funcionario" &&
        ticket.userId !== authenticatedUser.id
      ) {
        return NextResponse.json(
          { error: "Sem permissão para adicionar mensagens a este ticket" },
          { status: 403 }
        );
      }

      // Criar mensagem
      const message = await prisma.message.create({
        data: {
          texto: data.texto, // compatível com frontend
          user: { connect: { id: authenticatedUser.id } }, // conecta ao usuário
          ticket: { connect: { id: ticket.id } }, // conecta ao ticket
          data: new Date(),
        },
      });

      // Atualizar ticket
      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          messages: {
            orderBy: {
              data: "asc",
            },
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Mapear mensagens para o formato esperado pelo frontend
      const mappedTicket = updatedTicket
        ? {
            ...updatedTicket,
            messages: (updatedTicket.messages ?? []).map((msg) => ({
              id: msg.id,
              content: msg.texto,
              userId: msg.autor,
              ticketId: msg.ticketId,
              data: msg.data,
              user: msg.user ? { name: msg.user.name } : null,
            })),
          }
        : null;
      return NextResponse.json({ success: true, ticket: mappedTicket });
    } catch (verifyError) {
      console.error("Erro ao verificar token:", verifyError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar mensagem" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status do ticket
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const data = await request.json();
    const ticketId =
      typeof awaitedParams.id === "string"
        ? parseInt(awaitedParams.id, 10)
        : awaitedParams.id;
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: "ID do ticket inválido" },
        { status: 400 }
      );
    }
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
      where: { id: parseInt(decoded.userId, 10) },
    });

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar ticket atual
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Atualizar campos específicos
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assigneeId)
      updateData.assigneeId =
        typeof data.assigneeId === "string"
          ? parseInt(data.assigneeId, 10)
          : data.assigneeId;

    console.log("Dados de atualização:", updateData);

    // Atualizar ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
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

    console.log("Ticket atualizado:", updatedTicket);

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ticket" },
      { status: 500 }
    );
  }
}
