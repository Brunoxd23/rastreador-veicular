import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  console.log('Iniciando limpeza forçada do Prisma...');
  
  try {
    // Primeiro, remover todas as referências nos tickets
    console.log('Removendo referências nos tickets...');
    await prisma.$executeRaw`UPDATE "Ticket" SET "assigneeId" = NULL, "userId" = NULL`;
    
    // Depois, excluir todos os tickets
    console.log('Excluindo tickets...');
    await prisma.ticket.deleteMany({});
    
    // Por fim, excluir todos os usuários
    console.log('Excluindo usuários...');
    await prisma.user.deleteMany({});
    
    console.log('Limpeza concluída com sucesso');

    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados Prisma limpo com sucesso' 
    });
  } catch (error) {
    console.error('Erro na limpeza:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar dados: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 