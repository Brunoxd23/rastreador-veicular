"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import TopHeader from "./TopHeader";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import Loading from "./Loading";
import dynamic from "next/dynamic";

// Import dinâmico para evitar problemas de ícones no SSR (opcional) e garantir leveza
const MobileBottomNav = dynamic(() => import("./MobileBottomNav"), {
  ssr: false,
});

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { loading, loadingLogout } = useAuth();

  // Função para passar para Sidebar controlar o estado
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Largura do sidebar: 80px (w-20) colapsado, 256px (w-64) expandido
  const sidebarWidth = sidebarCollapsed ? 80 : 256;
  const isLogin = pathname === "/login" || pathname === "/";

  if (loading || loadingLogout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loading />
      </div>
    );
  }

  return (
    <>
      {/* TopHeader só aparece se não for login */}
      {!isLogin && <TopHeader sidebarCollapsed={sidebarCollapsed} />}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        {!isLogin && (
          <div className="hidden md:block">
            <Sidebar onCollapse={handleSidebarCollapse} />
          </div>
        )}
        {/* Conteúdo principal */}
        <main
          className="flex-1 min-w-0 transition-all duration-300 pb-16 md:pb-0"
          style={
            !isLogin
              ? {
                  paddingLeft:
                    typeof window !== "undefined" && window.innerWidth < 768
                      ? 0
                      : sidebarWidth,
                }
              : {}
          }
        >
          {children}
        </main>
      </div>
      {/* Footer só aparece se não for login */}
      {!isLogin && (
        <div className="hidden md:block" style={{ paddingLeft: sidebarWidth }}>
          <Footer />
        </div>
      )}
      {/* Navegação inferior mobile */}
      {!isLogin && <MobileBottomNav />}
    </>
  );
}
