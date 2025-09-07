import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { FiLogOut } from "react-icons/fi";
import { usePathname } from "next/navigation";

interface TopHeaderProps {
  sidebarCollapsed?: boolean;
}

const TopHeader = ({ sidebarCollapsed }: TopHeaderProps) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Não renderiza o TopHeader na página de login
  if (pathname === "/login") {
    return null;
  }

  // Data formatada
  const dataAtual = new Date();
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const dataFormatada = `${dataAtual.getDate().toString().padStart(2, "0")}
    de ${meses[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;

  // Sidebar: px-4 (16px) + ícone (32px) + gap-2 (8px) = 56px
  // Ajustar paddingLeft para alinhar a data ao ícone MoviTrace
  // Para alinhar verticalmente, usar mesma altura e padding do Sidebar
  // Largura do sidebar: 80px (w-20) colapsado, 256px (w-64) expandido
  const sidebarWidth = sidebarCollapsed ? 80 : 256;
  return (
    <header
      className="bg-white border-b flex items-center justify-between shadow-sm z-20 transition-all duration-300"
      style={{
        height: 72,
        marginLeft: sidebarWidth,
        paddingLeft: 56,
        paddingRight: 24,
      }}
    >
      {/* Data à esquerda, alinhada ao ícone do sidebar */}
      <div
        className="flex items-center gap-2 text-blue-700 font-medium text-base"
        style={{ height: 40, alignItems: "center" }}
      >
        <svg
          className="w-5 h-5 text-blue-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
          />
        </svg>
        <span>{dataFormatada}</span>
      </div>
      {/* Usuário logado */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="font-medium text-blue-900 text-sm leading-tight">
              {user.name}
            </span>
            <span className="text-xs text-gray-500">{user.email}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg select-none">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-100 transition-colors"
            title="Sair"
          >
            <FiLogOut className="w-5 h-5 text-blue-700" />
          </button>
        </div>
      )}
    </header>
  );
};

export default TopHeader;
