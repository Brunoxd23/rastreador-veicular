import { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { User } from "next-auth";

type UserRole = "admin" | "funcionario" | "client";

interface CustomUser extends User {
  role: UserRole;
  id: string;
}

// Extend the default Session and User types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
  interface User {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req): Promise<User | null> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email e senha são obrigatórios");
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("Usuário não encontrado");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Senha incorreta");
          }

          // Validar o role
          if (!["admin", "funcionario", "client"].includes(user.role)) {
            throw new Error("Tipo de usuário inválido");
          }

          // Log para debug
          console.log("Usuário autenticado:", {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          });

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
          } as CustomUser;
        } catch (error) {
          console.error("Erro na autenticação:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as CustomUser).role;
      }
      // Log para debug
      console.log("JWT Token:", token);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as UserRole;
      }
      // Log para debug
      console.log("Session:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
