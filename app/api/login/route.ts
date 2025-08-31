import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export async function POST(request: Request) {
  console.log('Iniciando processo de login...');
  
  const { email, password } = await request.json();
  console.log('Dados recebidos:', { email });

  try {
    console.log('Conectando ao MongoDB...');
    await dbConnect();
    console.log('Conectado ao MongoDB com sucesso');

    console.log('Buscando usuário...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Usuário não encontrado para o email:', email);
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado'
      }, { status: 400 });
    }

    console.log('Usuário encontrado:', {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });

    console.log('Verificando senha...');
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!isPasswordCorrect) {
      console.log('Senha incorreta para o usuário:', email);
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta'
      }, { status: 400 });
    }

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false
    };

    console.log('Preparando resposta com dados:', userData);

    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const response = {
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      user: userData
    };

    console.log('Enviando resposta:', JSON.stringify(response, null, 2));

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict`
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro no servidor'
    }, { status: 500 });
  }
}
