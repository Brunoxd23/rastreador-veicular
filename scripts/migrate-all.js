const { MongoClient, ObjectId } = require('mongodb');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const MONGODB_URI = process.env.DATABASE_URL || "mongodb+srv://Users:ZXyyQ1tPZvF6YXMO@users.drtdr.mongodb.net/my_database";

async function resetPrisma() {
  console.log('Iniciando reset completo do Prisma...');
  try {
    console.log('Deletando mensagens...');
    await prisma.message.deleteMany();
    console.log('Deletando tickets...');
    await prisma.ticket.deleteMany();
    console.log('Deletando usuários...');
    await prisma.user.deleteMany();
    console.log('Reset do Prisma concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao resetar Prisma:', error);
    throw error;
  }
}

async function migrateAll() {
  try {
    await resetPrisma();
    
    console.log('\nIniciando migração do MongoDB para Prisma...');
    
    const mongoClient = await MongoClient.connect(MONGODB_URI);
    const db = mongoClient.db('my_database');

    // Listar todas as coleções
    const collections = await db.listCollections().toArray();
    console.log('\nColeções encontradas no MongoDB:');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Migrar usuários primeiro
    console.log('\nMigrando usuários...');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Encontrados ${users.length} usuários para migrar`);
    
    const migratedUsers = new Map();
    
    for (const user of users) {
      try {
        const userData = {
          id: user._id.toString(),
          name: user.name || 'Usuário',
          email: user.email || `user_${user._id}@example.com`,
          password: user.password || '',
          role: user.role || 'client',
          createdAt: new Date(user.createdAt || Date.now()),
          updatedAt: new Date(user.updatedAt || Date.now())
        };

        const createdUser = await prisma.user.create({ data: userData });
        migratedUsers.set(user._id.toString(), createdUser);
        console.log(`✓ Usuário migrado: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`✗ Erro ao migrar usuário:`, error);
      }
    }

    // Buscar todos os tickets de todas as coleções possíveis
    console.log('\nBuscando todos os tickets...');
    const allTickets = [];
    
    // Buscar da coleção 'Ticket'
    try {
      const mainTickets = await db.collection('Ticket').find({}).toArray();
      console.log(`Encontrados ${mainTickets.length} tickets na coleção 'Ticket'`);
      allTickets.push(...mainTickets.map(t => ({ ...t, source: 'main' })));
    } catch (error) {
      console.log('Nenhum ticket encontrado na coleção Ticket');
    }
    
    // Buscar da coleção 'ticket'
    try {
      const clientTickets = await db.collection('ticket').find({}).toArray();
      console.log(`Encontrados ${clientTickets.length} tickets na coleção 'ticket'`);
      allTickets.push(...clientTickets.map(t => ({ ...t, source: 'client' })));
    } catch (error) {
      console.log('Nenhum ticket encontrado na coleção ticket');
    }
    
    // Buscar da coleção 'tickets'
    try {
      const staffTickets = await db.collection('tickets').find({}).toArray();
      console.log(`Encontrados ${staffTickets.length} tickets na coleção 'tickets'`);
      allTickets.push(...staffTickets.map(t => ({ ...t, source: 'staff' })));
    } catch (error) {
      console.log('Nenhum ticket encontrado na coleção tickets');
    }

    console.log(`\nTotal de ${allTickets.length} tickets para migrar`);
    const migratedTickets = new Map();

    // Migrar todos os tickets
    for (const ticket of allTickets) {
      if (!migratedTickets.has(ticket._id.toString())) {
        try {
          // Normalizar dados do ticket
          let userId = ticket.cliente || ticket.userId || ticket.user_id;
          if (userId && typeof userId === 'object') {
            userId = userId.toString();
          }

          let assigneeId = ticket.atendente || ticket.assigneeId;
          if (assigneeId && typeof assigneeId === 'object') {
            assigneeId = assigneeId.toString();
          }

          // Determinar o status correto
          let status = ticket.status;
          if (!status) {
            if (ticket.source === 'staff' || assigneeId) {
              status = 'em_atendimento';
            } else {
              status = 'aberto';
            }
          }

          const ticketData = {
            id: ticket._id.toString(),
            title: ticket.titulo || ticket.title || 'Sem título',
            description: ticket.descricao || ticket.description || '',
            status: status,
            priority: ticket.prioridade || ticket.priority || 'baixa',
            userId: userId,
            assigneeId: assigneeId,
            createdAt: new Date(ticket.dataCriacao || ticket.createdAt || Date.now()),
            updatedAt: new Date(ticket.updatedAt || Date.now()),
            resolution: ticket.resolution || ''
          };

          console.log(`\nMigrando ticket ${ticketData.id}:`);
          console.log('- Título:', ticketData.title);
          console.log('- Cliente:', ticketData.userId);
          console.log('- Status:', ticketData.status);
          console.log('- Atendente:', ticketData.assigneeId || 'Não atribuído');
          console.log('- Origem:', ticket.source);

          const createdTicket = await prisma.ticket.create({ data: ticketData });
          migratedTickets.set(ticket._id.toString(), createdTicket);
          
          // Migrar mensagens do ticket
          if (ticket.mensagens && Array.isArray(ticket.mensagens)) {
            for (const msg of ticket.mensagens) {
              try {
                const messageData = {
                  id: msg._id ? msg._id.toString() : new ObjectId().toString(),
                  texto: msg.texto || msg.text || '',
                  autor: msg.autor || msg.author || userId,
                  data: new Date(msg.data || msg.date || Date.now()),
                  ticketId: createdTicket.id
                };

                await prisma.message.create({ data: messageData });
                console.log(`  ✓ Mensagem ${messageData.id} migrada`);
              } catch (msgError) {
                console.error(`  ✗ Erro ao migrar mensagem:`, msgError);
              }
            }
          }
          
          console.log(`✓ Ticket migrado com sucesso`);
        } catch (error) {
          console.error(`✗ Erro ao migrar ticket ${ticket._id}:`, error);
          console.error('Dados do ticket:', ticket);
        }
      }
    }

    console.log('\n=== Resumo da Migração ===');
    console.log(`✓ Usuários migrados: ${migratedUsers.size}`);
    console.log(`✓ Total de tickets migrados: ${migratedTickets.size}`);

    await mongoClient.close();
    await prisma.$disconnect();

    console.log('\nPróximos passos:');
    console.log('1. Execute: npx prisma generate');
    console.log('2. Reinicie seu servidor Next.js');
    console.log('3. Verifique os dados no Prisma Studio: npx prisma studio');

  } catch (error) {
    console.error('\n✗ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar a migração
migrateAll().catch(console.error); 