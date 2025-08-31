import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import prisma from '@/lib/prisma';

export async function POST() {
  console.log('Iniciando migração do MongoDB para o Prisma...');
  
  try {
    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    const client = await MongoClient.connect(process.env.MONGODB_URI || '');
    const db = client.db();
    const usersCollection = db.collection('users');
    const ticketsCollection = db.collection('tickets');

    // Limpar dados existentes no Prisma
    console.log('Limpando dados existentes no Prisma...');
    await prisma.ticket.deleteMany();
    await prisma.user.deleteMany();

    // Buscar todos os usuários do MongoDB
    console.log('Buscando usuários do MongoDB...');
    const mongoUsers = await usersCollection.find({}).toArray();
    console.log(`Encontrados ${mongoUsers.length} usuários no MongoDB`);

    // Criar usuários no Prisma
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
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt || Date.now())
          }
        });
        console.log(`Usuário migrado com sucesso: ${user.email}`);
      } catch (error) {
        console.error(`Erro ao migrar usuário ${user.email}:`, error);
      }
    }

    // Buscar todos os tickets do MongoDB
    console.log('Buscando tickets do MongoDB...');
    const mongoTickets = await ticketsCollection.find({}).toArray();
    console.log(`Encontrados ${mongoTickets.length} tickets no MongoDB`);

    // Criar tickets no Prisma
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
            createdAt: new Date(ticket.createdAt),
            updatedAt: new Date(ticket.updatedAt || Date.now())
          }
        });
        console.log(`Ticket migrado com sucesso: ${ticket._id}`);
      } catch (error) {
        console.error(`Erro ao migrar ticket ${ticket._id}:`, error);
      }
    }

    await client.close();
    console.log('Migração concluída com sucesso');

    return NextResponse.json({ 
      success: true, 
      message: `Migração concluída: ${mongoUsers.length} usuários e ${mongoTickets.length} tickets migrados` 
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json(
      { error: 'Erro na migração: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 