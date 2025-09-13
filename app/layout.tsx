import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ClientWrapper from "./components/ClientWrapper";
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
          <ClientWrapper>{children}</ClientWrapper>
        </AuthProvider>
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
