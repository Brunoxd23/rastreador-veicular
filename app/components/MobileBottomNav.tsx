"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiBarChart2,
  FiTruck,
  FiDollarSign,
  FiHelpCircle,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

// Navegação inferior somente mobile (< md)
// Rotas solicitadas: Dashboard (/dashboard), Meus Veículos (/meus-veiculos), Financeiro (/financeiro), Suporte (/tickets ou /suporte?)
// Assumindo que a rota de suporte usada no sidebar existente é /tickets para clientes (label Suporte).
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactElement;
  match?: (pathname: string) => boolean; // permitir custom de active
}

const items: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <FiBarChart2 className="w-6 h-6" />,
  },
  {
    href: "/meus-veiculos",
    label: "Veículos",
    icon: <FiTruck className="w-6 h-6" />,
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: <FiDollarSign className="w-6 h-6" />,
  },
  {
    href: "/tickets",
    label: "Suporte",
    icon: <FiHelpCircle className="w-6 h-6" />,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar somente se autenticado e não estiver em rotas de login
    if (!user) {
      setVisible(false);
      return;
    }
    if (pathname === "/login" || pathname === "/") {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [user, pathname]);

  if (!visible) return null;

  return (
    <nav
      data-mobile-nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[12000] bg-white/95 backdrop-blur border-t shadow-lg flex justify-around items-stretch h-16 pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => {
        const active = item.match
          ? item.match(pathname)
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col flex-1 items-center justify-center gap-0.5 text-xs font-medium transition-colors relative ${
              active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.icon}
            <span className="leading-none">{item.label}</span>
            {active && (
              <span className="absolute -top-1 h-1 w-8 rounded-full bg-blue-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
