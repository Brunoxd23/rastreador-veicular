"use client";
import { Toaster } from "react-hot-toast";
import Footer from "../components/Footer";
import TopHeader from "../components/TopHeader";
import "../globals.css";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col bg-gray-100">
        <TopHeader sidebarCollapsed={false} />
        <main className="flex-1 min-w-0 transition-all duration-300 w-full">
          {children}
        </main>
        <Footer />
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
      </body>
    </html>
  );
}
