import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("id");
    const userId = userIdParam ? Number(userIdParam) : undefined;
    if (!userId || isNaN(userId)) {
      return new Response(
        JSON.stringify({ error: "ID não fornecido ou inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Iniciando exclusão do usuário:", userId);

    try {
      // Primeiro, remover todas as referências nos tickets
      console.log("Removendo referências nos tickets...");
      await prisma.ticket.updateMany({
        where: {
          OR: [{ userId: userId }, { assigneeId: userId }],
        },
        data: {
          assigneeId: null,
        },
      });

      // Depois, tentar excluir o usuário
      console.log("Excluindo usuário...");
      const deletedUser = await prisma.user.delete({
        where: {
          id: userId,
        },
      });

      console.log("Usuário excluído:", deletedUser.email);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Usuário excluído com sucesso",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (prismaError) {
      console.error("Erro Prisma:", prismaError);
      return new Response(
        JSON.stringify({
          error:
            "Erro ao excluir usuário no Prisma: " +
            (prismaError instanceof Error
              ? prismaError.message
              : String(prismaError)),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({
        error:
          "Erro ao processar requisição: " +
          (error instanceof Error ? error.message : String(error)),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
