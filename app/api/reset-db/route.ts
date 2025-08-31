import { NextResponse } from 'next/server';
import dbConnect from '../../lib/mongodb';
import mongoose from 'mongoose';
import User from '../../models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Verifica se está no banco correto
    if (mongoose.connection.db?.databaseName !== 'my_database') {
      throw new Error(`Conectado ao banco errado: ${mongoose.connection.db?.databaseName}`);
    }

    // Limpa a coleção users usando o modelo
    await User.deleteMany({});
    console.log('Coleção users limpa com sucesso');
    
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Banco de dados resetado com sucesso',
        database: mongoose.connection.db?.databaseName,
        collection: 'users'
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao resetar banco:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: `Erro ao resetar banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      }),
      { status: 500 }
    );
  }
} 