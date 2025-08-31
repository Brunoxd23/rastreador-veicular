// components/LoginForm.tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "react-feather";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usa a função login do contexto de autenticação
      await login(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-400 to-purple-400">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 rounded-full p-3 mb-2">
            {/* Ícone MoviTrace (globe) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-10 h-10"
            >
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <path
                stroke="white"
                strokeWidth="2"
                d="M2 12h20M12 2c3.5 4 3.5 16 0 20M12 2c-3.5 4-3.5 16 0 20"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">
            MoviTrace
          </h1>
          <span className="text-sm text-gray-500 mt-1">Acesso ao sistema</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
              required
              placeholder="Digite seu email"
            />
          </div>
          <div className="relative">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              Senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base pr-12"
              required
              placeholder="Digite sua senha"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-9 right-4 text-gray-500 hover:text-indigo-600 focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
