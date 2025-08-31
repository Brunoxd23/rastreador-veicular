import bcrypt from 'bcryptjs';
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  await dbConnect();

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ success: false, message: 'Email já registrado.' }), {
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    return new Response(JSON.stringify({ success: true, message: 'Usuário cadastrado com sucesso!' }), {
      status: 201,
    });
  } catch (error) {
    const errMessage = (error as Error).message; // Tipagem do erro
    console.error('Erro no cadastro:', errMessage);
    return new Response(JSON.stringify({ success: false, message: 'Erro no servidor.' }), {
      status: 500,
    });
  }
}
