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

  // Datas formatadas
  const agora = new Date();
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
  const dataLonga = `${agora.getDate().toString().padStart(2, "0")} de ${
    meses[agora.getMonth()]
  } ${agora.getFullYear()}`;
  const dataCurta = `${agora.getDate().toString().padStart(2, "0")}/${(
    agora.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${agora.getFullYear().toString().slice(-2)}`;

  // Sidebar: px-4 (16px) + ícone (32px) + gap-2 (8px) = 56px
  // Ajustar paddingLeft para alinhar a data ao ícone MoviTrace
  // Para alinhar verticalmente, usar mesma altura e padding do Sidebar
  // Largura do sidebar: 80px (w-20) colapsado, 256px (w-64) expandido
  const sidebarWidth = sidebarCollapsed ? 80 : 256;
  return (
    <>
      {/* Desktop / md+ */}
      <header
        className="hidden md:flex bg-white border-b items-center justify-between shadow-sm z-20 transition-all duration-300"
        style={{
          height: 72,
          marginLeft: sidebarWidth,
          paddingLeft: 56,
          paddingRight: 24,
        }}
      >
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
          <span>{dataLonga}</span>
        </div>
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
      {/* Mobile < md */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b shadow-sm z-30 flex items-center px-3">
        {/* Logo + nome sistema */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {/* Logo simples (pode substituir por <Image /> se houver asset) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 0 0 20M12 2a15.3 15.3 0 0 1 0 20" />
            </svg>
          </div>
          <span className="text-blue-700 font-semibold tracking-tight text-base select-none">
            MoviTrace
          </span>
        </div>
        {/* Data curta central */}
        <div className="flex-1 text-center">
          <span className="text-[13px] font-medium text-blue-700">
            {dataCurta}
          </span>
        </div>
        {/* Nome + sair */}
        {user && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="max-w-[90px] truncate text-[13px] font-medium text-blue-900">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold active:scale-95 transition"
            >
              Sair
            </button>
          </div>
        )}
      </header>
      {/* Espaço para não sobrepor conteúdo em mobile */}
      <div className="md:hidden h-14" />
    </>
  );
};

export default TopHeader;
