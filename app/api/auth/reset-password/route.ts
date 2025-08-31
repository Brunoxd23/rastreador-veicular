import { NextResponse } from 'next/server';
import { connectDB } from '../../../utils/database';
import User from '../../../models/User';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o usuário pelo token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Atualiza a senha - isso acionará o middleware de hash no modelo
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
} 