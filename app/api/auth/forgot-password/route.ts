import { NextResponse } from 'next/server';
import { connectDB } from '../../../utils/database';
import User from '../../../models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuração do nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Tempo mínimo entre solicitações (15 minutos em milissegundos)
const MIN_TIME_BETWEEN_REQUESTS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Busca o usuário pelo email
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se já existe um token válido e se foi solicitado recentemente
    const now = Date.now();
    if (user.resetPasswordToken && user.resetPasswordExpires) {
      const timeSinceLastRequest = now - (user.resetPasswordExpires.getTime() - 3600000);
      
      if (timeSinceLastRequest < MIN_TIME_BETWEEN_REQUESTS) {
        const minutesRemaining = Math.ceil((MIN_TIME_BETWEEN_REQUESTS - timeSinceLastRequest) / 60000);
        return NextResponse.json(
          { 
            success: false, 
            message: `Por favor, aguarde ${minutesRemaining} minutos antes de solicitar um novo reset de senha.` 
          },
          { status: 429 }
        );
      }

      // Se o token ainda é válido (expira em mais de 30 minutos), reenvia o mesmo token
      if (user.resetPasswordExpires.getTime() - now > 1800000) {
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${user.resetPasswordToken}`;
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Recuperação de Senha',
          html: `
            <h1>Recuperação de Senha</h1>
            <p>Você solicitou a recuperação de senha novamente.</p>
            <p>Clique no link abaixo para redefinir sua senha:</p>
            <a href="${resetUrl}">Redefinir Senha</a>
            <p>Este link é válido por ${Math.ceil((user.resetPasswordExpires.getTime() - now) / 60000)} minutos.</p>
            <p>Se você não solicitou esta recuperação, ignore este email.</p>
          `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({
          success: true,
          message: 'Email de recuperação reenviado com sucesso'
        });
      }
    }

    // Se não tem token válido ou o token está próximo de expirar, gera um novo
    const token = crypto.randomBytes(20).toString('hex');
    const resetPasswordExpires = new Date(now + 3600000); // 1 hora

    // Salva o token no usuário
    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // URL de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // Envia o email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">Redefinir Senha</a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao enviar email de recuperação' },
      { status: 500 }
    );
  }
} 