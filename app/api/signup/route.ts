import bcrypt from "bcryptjs";
import { prisma } from "../../utils/database";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  await prisma.$connect();

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, message: "Email já registrado." }),
        {
          status: 400,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário cadastrado com sucesso!",
      }),
      {
        status: 201,
      }
    );
  } catch (error) {
    const errMessage = (error as Error).message; // Tipagem do erro
    console.error("Erro no cadastro:", errMessage);
    return new Response(
      JSON.stringify({ success: false, message: "Erro no servidor." }),
      {
        status: 500,
      }
    );
  }
}
