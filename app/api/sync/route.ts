import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function POST() {
  console.log('Iniciando rota de sincronização...');
  
  try {
    // Verificar autenticação
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    console.log('Token encontrado:', !!token?.value);

    if (!token?.value) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    try {
      // Verificar e decodificar o token
      const decoded = verify(token.value, process.env.JWT_SECRET || '') as { userId: string };
      console.log('Token decodificado, userId:', decoded.userId);

      // Buscar usuário autenticado
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      console.log('Usuário autenticado:', authenticatedUser?.email);

      if (!authenticatedUser || authenticatedUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Apenas administradores podem sincronizar os dados' },
          { status: 403 }
        );
      }

      // Conectar ao MongoDB
      console.log('Conectando ao MongoDB...');
      const client = await MongoClient.connect(process.env.MONGODB_URI || '');
      const db = client.db();
      const usersCollection = db.collection('users');
      const ticketsCollection = db.collection('tickets');

      console.log('Iniciando processo de sincronização...');

      // Primeiro, limpar todos os dados do Prisma
      console.log('Limpando dados do Prisma...');
      await prisma.ticket.deleteMany({});
      await prisma.user.deleteMany({});
      console.log('Dados do Prisma limpos');

      // Buscar todos os tickets do MongoDB
      const mongoTickets = await ticketsCollection.find({}).toArray();
      console.log('Tickets encontrados no MongoDB:', mongoTickets.length);

      // Buscar todos os usuários do MongoDB
      const mongoUsers = await usersCollection.find({}).toArray();
      console.log('Usuários encontrados no MongoDB:', mongoUsers.length);

      // Primeiro criar os usuários no Prisma
      console.log('Criando usuários no Prisma...');
      for (const user of mongoUsers) {
        try {
          await prisma.user.create({
            data: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              password: user.password,
              role: user.role,
              createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
              updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt || Date.now())
            }
          });
          console.log('Usuário sincronizado:', user.email);
        } catch (error) {
          console.error('Erro ao sincronizar usuário:', user.email, error);
        }
      }

      // Depois criar os tickets no Prisma
      console.log('Criando tickets no Prisma...');
      for (const ticket of mongoTickets) {
        try {
          await prisma.ticket.create({
            data: {
              id: ticket._id.toString(),
              title: ticket.title,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              userId: ticket.userId,
              assigneeId: ticket.assigneeId,
              createdAt: ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt),
              updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt : new Date(ticket.updatedAt || Date.now())
            }
          });
          console.log('Ticket sincronizado:', ticket._id.toString());
        } catch (error) {
          console.error('Erro ao sincronizar ticket:', ticket._id.toString(), error);
        }
      }

      await client.close();
      console.log('Sincronização concluída');

      return NextResponse.json({ 
        success: true, 
        message: `Sincronização concluída: ${mongoUsers.length} usuários e ${mongoTickets.length} tickets` 
      });
    } catch (verifyError) {
      console.error('Erro ao verificar token:', verifyError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar dados: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 