import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_database';
const DATABASE_NAME = 'my_database';

const dbConnect = async () => {
  try {
    // Se já estiver conectado ao banco correto, retorna
    if (
      mongoose.connection.readyState >= 1 &&
      mongoose.connection.db?.databaseName === DATABASE_NAME
    ) {
      return;
    }

    // Se estiver conectado a outro banco, desconecta
    if (mongoose.connection.readyState >= 1) {
      await mongoose.disconnect();
    }

    // Conecta ao MongoDB forçando o banco my_database
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
      autoCreate: true // Cria o banco se não existir
    });

    // Verifica se a conexão foi estabelecida e se o banco de dados está acessível
    if (!conn.connection.db) {
      throw new Error('Falha ao conectar ao banco de dados');
    }

    console.log(`MongoDB Conectado: ${conn.connection.host}/${conn.connection.db.databaseName}`);
    
    // Verifica se está no banco correto
    const dbName = conn.connection.db.databaseName;
    if (dbName !== DATABASE_NAME) {
      throw new Error(`Conectado ao banco errado: ${dbName}`);
    }

  } catch (error) {
    console.error('Erro na conexão com MongoDB:', error);
    throw error;
  }
};

export default dbConnect;
