import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import Loading from "./Loading";
import {
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiBarChart2,
  FiTruck,
  FiDollarSign,
  FiHelpCircle,
  FiHome,
} from "react-icons/fi";

const menuIcons = {
  dashboard: <FiBarChart2 className="w-5 h-5" />, // Dashboard
  usuarios: <FiUsers className="w-5 h-5" />, // Usuários
  veiculos: <FiTruck className="w-5 h-5" />, // Veículos
  tickets: <FiHelpCircle className="w-5 h-5" />, // Tickets
  financeiro: <FiDollarSign className="w-5 h-5" />, // Financeiro
  configuracoes: <FiSettings className="w-5 h-5" />, // Configurações
};

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (onCollapse) onCollapse(collapsed);
  }, [collapsed, onCollapse]);

  // Não renderiza o Sidebar na página de login
  if (!user || pathname === "/login") return null;

  // Sidebar agora é relativa, não fixed, para layout responsivo
  // O layout pai deve garantir o espaçamento lateral

  const staffMenus = [
    { href: "/dashboard", label: "Dashboard", icon: menuIcons.dashboard },
    { href: "/usuarios", label: "Usuários", icon: menuIcons.usuarios },
    { href: "/veiculos", label: "Veículos", icon: menuIcons.veiculos },
    { href: "/tickets", label: "Tickets", icon: menuIcons.tickets },
    { href: "/financeiro", label: "Financeiro", icon: menuIcons.financeiro },
    {
      href: "/configuracoes",
      label: "Configurações",
      icon: menuIcons.configuracoes,
    },
  ];

  const clientMenus = [
    { href: "/dashboard", label: "Dashboard", icon: menuIcons.dashboard },
    {
      href: "/meus-veiculos",
      label: "Meus Veículos",
      icon: menuIcons.veiculos,
    },
    { href: "/financeiro", label: "Financeiro", icon: menuIcons.financeiro },
    { href: "/tickets", label: "Suporte", icon: menuIcons.tickets },
  ];

  const menuItems =
    user.role === "admin" || user.role === "funcionario"
      ? staffMenus
      : clientMenus;

  return (
    <aside
      className={`bg-white shadow-lg h-screen transition-all duration-300 flex flex-col border-r
        ${collapsed ? "w-20" : "w-64"}`}
      style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30 }}
    >
      {/* Botão de colapsar */}
      <button
        className="absolute -right-3 top-4 bg-blue-100 border border-blue-300 rounded-full p-0 shadow hover:bg-blue-200 transition-colors z-40"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        type="button"
      >
        {collapsed ? (
          <FiChevronRight className="w-5 h-5 text-blue-700" />
        ) : (
          <FiChevronLeft className="w-5 h-5 text-blue-700" />
        )}
      </button>
      {/* Logo e nome (só quando expandido), alinhado ao topo */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-4">
        <span className="bg-indigo-600 rounded-full p-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-8 h-8"
          >
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              stroke="white"
              strokeWidth="2"
              d="M2 12h20M12 2c3.5 4 3.5 16 0 20M12 2c-3.5 4-3.5 16 0 20"
            />
          </svg>
        </span>
        {!collapsed && (
          <span className="text-xl font-bold text-blue-700 tracking-tight select-none">
            MoviTrace
          </span>
        )}
      </div>
      {/* Navegação */}
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex gap-3 p-3 rounded-lg transition-colors group justify-center items-center text-center
                  ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-blue-50"
                  }`}
                title={item.label}
              >
                {item.icon}
                {!collapsed && (
                  <span className="block w-full text-center">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Área do usuário e logout */}
      <div className="px-2 py-4 border-t flex flex-col items-center gap-2">
        {!collapsed && user?.name && (
          <span className="text-xs text-blue-700 truncate w-full text-center">
            {user.name}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-100 transition-colors"
          title="Sair"
        >
          <FiLogOut className="w-5 h-5 text-red-600" />
        </button>
      </div>
    </aside>
  );
}
