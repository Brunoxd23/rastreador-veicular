"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
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
      <Header />
      <div className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Gestão do Sistema</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Ações disponíveis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/configuracoes/rastreador")}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold shadow hover:bg-purple-700 transition-colors text-base"
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
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors text-base"
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
