import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export async function POST(request: Request) {
  await dbConnect();

  try {
    // Dados do administrador
    const adminData = {
      name: 'Administrador',
      email: 'admin@admin.com',
      password: 'admin123',
      role: 'admin'
    };

    // Verifica se já existe um usuário com este email
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: 'Usuário administrador já existe' 
        }),
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Cria o usuário administrador
    const newAdmin = new User({
      ...adminData,
      password: hashedPassword
    });

    await newAdmin.save();

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Administrador criado com sucesso',
        credentials: {
          email: adminData.email,
          password: adminData.password // Enviando a senha não criptografada para teste
        }
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: 'Erro ao criar administrador' 
      }),
      { status: 500 }
    );
  }
} 