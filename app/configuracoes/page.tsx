"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import Header from "../components/Header";
import Loading from "../components/Loading";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Simulando carregamento inicial
  React.useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-3 py-1.5 rounded font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-sm shadow"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Gestão do Sistema</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ações disponíveis</h2>
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => router.push("/configuracoes/rastreador")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-3 py-1.5 rounded font-semibold shadow hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-sm w-full sm:w-64"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Cadastro de Rastreador
            </button>
            <button
              onClick={() => router.push("/configuracoes/veiculo")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-3 py-1.5 rounded font-semibold shadow hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 text-sm w-full sm:w-64"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M3 14h18M5 6h14M5 18h14"
                />
              </svg>
              Cadastro de Veículo
            </button>
            {/* Adicione mais botões para futuras configurações */}
          </div>
        </div>
      </div>
    </div>
  );
}
