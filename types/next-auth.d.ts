import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  type UserRole = 'admin' | 'funcionario' | 'client';

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'funcionario' | 'client';
  }
} 