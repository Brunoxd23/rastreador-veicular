"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Loading from "../components/Loading";

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchFaturas() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/financeiro/faturas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.faturas)) {
          setFaturas(data.faturas);
        } else {
          setError(data.error || "Erro ao buscar faturas");
        }
      } catch {
        setError("Erro ao buscar faturas");
      } finally {
        setLoading(false);
      }
    }
    fetchFaturas();
  }, []);

  if (loading) return <Loading />;

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
          <h1 className="text-2xl font-bold">Gerenciar Financeiro</h1>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          {error &&
            error !== "Token inválido" &&
            error !== "Não autorizado" && (
              <div className="text-red-600 mb-4">{error}</div>
            )}
          {faturas.length === 0 &&
          (!error ||
            error === "Token inválido" ||
            error === "Não autorizado") ? (
            <p className="text-gray-600">Nenhuma fatura encontrada.</p>
          ) : faturas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Rastreador</th>
                    <th className="px-4 py-2 text-left">Modelo</th>
                    <th className="px-4 py-2 text-left">Valor</th>
                    <th className="px-4 py-2 text-left">Vencimento</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="px-4 py-2">{f.id}</td>
                      <td className="px-4 py-2">
                        {f.rastreador?.user?.name || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {f.rastreador?.identificador}
                      </td>
                      <td className="px-4 py-2">{f.rastreador?.modelo}</td>
                      <td className="px-4 py-2">R$ {f.valor.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {new Date(f.dataVencimento).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-4 py-2 font-bold ${
                          f.status === "paga"
                            ? "text-green-600"
                            : f.status === "pendente"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {f.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
