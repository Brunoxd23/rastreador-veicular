"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Loading from "../components/Loading";
import dynamic from "next/dynamic";
const VeiculoHistoricoMap = dynamic(() => import("./VeiculoHistoricoMap"), {
  ssr: false,
});

function VeiculosContent() {
  const [loading, setLoading] = useState(true);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [showHistorico, setShowHistorico] = useState<{
    id: number;
    plate: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchVeiculos() {
      try {
        // Busca todos os veículos SEM FILTRO, independente do role
        const res = await fetch("/api/veiculos");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao buscar veículos");
        } else if (data.success && Array.isArray(data.vehicles)) {
          if (data.vehicles.length === 0) {
            setError(""); // Não mostra erro, só exibe mensagem de nenhum veículo
            setVeiculos([]);
          } else {
            setVeiculos(data.vehicles);
            setError("");
          }
        } else {
          setError(
            "Erro inesperado ao buscar veículos. Verifique o backend ou os dados."
          );
        }
      } catch {
        setError("Erro ao buscar veículos");
      } finally {
        setLoading(false);
      }
    }
    fetchVeiculos();
    // Exibe toast se veio ?success=1 na URL
    if (searchParams.get("success") === "1") {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  }, [searchParams]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <Header />
      <div className="p-8">
        {showToast && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded shadow-lg animate-fade-in">
            Veículo cadastrado com sucesso!
          </div>
        )}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold">Meus Veículos</h1>
          <button
            onClick={() => router.push("/configuracoes/veiculo")}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            + Novo Veículo
          </button>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          {error && error !== "Token inválido" && (
            <div className="text-red-600 mb-4">{error}</div>
          )}
          {veiculos.length === 0 && (!error || error === "Token inválido") ? (
            <div className="text-gray-600">
              Nenhum veículo cadastrado.
              <br />
              <span className="text-xs text-red-500">
                (Debug: veiculos.length = 0)
              </span>
            </div>
          ) : veiculos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {veiculos.map((v) => (
                <div
                  key={v.id}
                  className="border rounded-lg p-4 shadow hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                    <span className="font-bold text-lg">{v.plate}</span>
                  </div>
                  <div className="text-gray-700">
                    Modelo: <span className="font-medium">{v.model}</span>
                  </div>
                  <div className="text-gray-700">
                    Marca: <span className="font-medium">{v.brand}</span>
                  </div>
                  <div className="text-gray-700">
                    Ano: <span className="font-medium">{v.year}</span>
                  </div>
                  {v.user && (
                    <div className="text-gray-700 mt-2">
                      Usuário vinculado:{" "}
                      <span className="font-medium">{v.user.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({v.user.email})
                      </span>
                    </div>
                  )}
                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-blue-700 transition-colors">
                      Atualizar posição
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-blue-600 transition-colors">
                      Enviar comando
                    </button>
                    <button
                      className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 text-blue-900 px-4 py-2 rounded font-semibold text-sm border border-blue-400 hover:from-blue-500 hover:via-blue-400 hover:to-blue-300"
                      onClick={() =>
                        setShowHistorico({ id: v.id, plate: v.plate })
                      }
                    >
                      Mostrar histórico
                    </button>
                  </div>
                  {/* Modal do histórico de posições - renderizado fora do loop */}
                  {showHistorico && showHistorico.id === v.id && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-2">
                      <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 max-w-2xl w-full relative overflow-y-auto max-h-[90vh]">
                        <button
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowHistorico(null)}
                        >
                          &times;
                        </button>
                        <h3 className="text-xl font-bold mb-4 text-blue-700">
                          Histórico de posições - {showHistorico.plate}
                        </h3>
                        <div className="w-full h-96 mb-4">
                          <VeiculoHistoricoMap veiculoId={showHistorico.id} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VeiculosPage() {
  return (
    <Suspense>
      <VeiculosContent />
    </Suspense>
  );
}
