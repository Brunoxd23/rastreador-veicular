"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import TopHeader from "./components/TopHeader";
import Sidebar from "./components/Sidebar";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-gray-100">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { loading, loadingLogout } = useAuth();

  // Função para passar para Sidebar controlar o estado
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Largura do sidebar: 80px (w-20) colapsado, 256px (w-64) expandido
  const sidebarWidth = sidebarCollapsed ? 80 : 256;
  const isLogin = pathname === "/login";

  if (loading || loadingLogout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <TopHeader sidebarCollapsed={sidebarCollapsed} />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar só aparece se não for login */}
        {!isLogin && <Sidebar onCollapse={handleSidebarCollapse} />}
        {/* Conteúdo principal */}
        <main
          className="flex-1 min-w-0 transition-all duration-300"
          style={!isLogin ? { paddingLeft: sidebarWidth } : {}}
        >
          {children}
        </main>
      </div>
      {/* Footer acompanha sidebar */}
      <div style={!isLogin ? { paddingLeft: sidebarWidth } : {}}>
        <Footer />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          loading: {
            duration: Infinity,
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#4CAF50",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#f44336",
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
}
