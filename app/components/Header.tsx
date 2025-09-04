"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { FiLogOut } from "react-icons/fi";

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Não renderiza o header na página de login
  if (pathname === "/login") {
    return null;
  }

  function isActive(path: string) {
    return pathname === path
      ? "text-purple-600 border-b-2 border-purple-600"
      : "text-gray-600 hover:text-purple-600";
  }

  // Função para determinar quais menus mostrar baseado no role
  const getMenuItems = () => {
    if (user?.role === "admin" || user?.role === "funcionario") {
      return [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/tickets", label: "Tickets" },
        { path: "/veiculos", label: "Veículos" },
        { path: "/financeiro", label: "Financeiro" },
        { path: "/usuarios", label: "Usuários" },
        { path: "/configuracoes", label: "Configurações" },
      ];
    } else {
      return [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/meus-veiculos", label: "Meus Veículos" },
        { path: "/tickets", label: "Suporte" },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Botão do Menu */}
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-blue-700">
              {user?.role === "admin" || user?.role === "funcionario"
                ? "Painel Admin"
                : "Sistema de Rastreamento"}
            </Link>
            {/* Botão do Menu Hambúrguer */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-4 -mr-2 h-10 w-10 inline-flex items-center justify-center rounded-md p-2 text-blue-700 hover:bg-blue-100 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 md:hidden"
            >
              <span className="sr-only">Abrir menu</span>
              {/* Ícone do Menu */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Menu de Navegação Desktop */}
          <nav className="hidden md:ml-10 md:flex md:space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-blue-700 hover:text-blue-900 hover:border-b-2 hover:border-blue-300 transition-colors ${
                  pathname === item.path ? "border-b-2 border-blue-300" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Área do Usuário */}
          <div className="hidden md:flex items-center space-x-4">
            {user?.name && (
              <span className="text-sm text-blue-700">
                Bem-vindo,{" "}
                <span className="font-medium text-blue-600">{user.name}</span>
              </span>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-md text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors flex items-center"
              title="Sair"
            >
              <FiLogOut className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`${isMenuOpen ? "block" : "hidden"} md:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block pl-3 pr-4 py-2 text-base font-medium border-l-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 hover:text-white border-red-600 transition-colors`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* Área do Usuário Mobile */}
          <div className="pt-4 pb-3 border-t border-blue-300">
            {user?.name && (
              <div className="px-4 py-2">
                <div className="text-base font-medium text-blue-700">
                  Bem-vindo, <span className="text-blue-600">{user.name}</span>
                </div>
              </div>
            )}
            <div className="px-4 py-2">
              <button
                onClick={logout}
                className="w-10 h-10 flex justify-center items-center rounded-md text-blue-700 hover:bg-blue-100 hover:text-blue-900"
                title="Sair"
              >
                <FiLogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
