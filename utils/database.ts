import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}

export async function connectDB() {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI);

    if (connection.readyState === 1) {
      console.log('Conectado ao MongoDB');
      return;
    }
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    throw error;
  }
} 