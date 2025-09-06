"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Loading from "../components/Loading";

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [faturas, setFaturas] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    async function fetchFaturas() {
      try {
        const res = await fetch("/api/financeiro/faturas");
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
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();
        setUserRole(data.user?.role || "");
      } catch {
        setUserRole("");
      }
    }
    fetchFaturas();
    fetchUserRole();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <Header />
      <div className="p-8">
        <button
          onClick={() => window.history.back()}
          className="mb-6 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-md shadow hover:from-blue-600 hover:to-blue-800 transition"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold mb-6">Financeiro</h1>
        <div className="bg-white shadow rounded-lg p-6">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {faturas.length === 0 ? (
            <p className="text-gray-600">Nenhuma fatura encontrada.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Nome
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Rastreador
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Modelo
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Valor
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Vencimento
                    </th>
                    <th className="px-2 py-2 text-left whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((l) => {
                    const hoje = new Date();
                    const venc = new Date(l.dataVencimento);
                    let status = "Ativa";
                    let statusClass = "text-blue-600";
                    if (l.status === "paga") {
                      status = "Paga";
                      statusClass = "text-green-600";
                    } else if (venc < hoje) {
                      status = "Vencida";
                      statusClass = "text-red-600";
                    } else if (
                      (venc.getTime() - hoje.getTime()) /
                        (1000 * 60 * 60 * 24) <
                      7
                    ) {
                      status = "Vence em breve";
                      statusClass = "text-yellow-600";
                    }
                    const podePagar =
                      l.status !== "paga" && userRole !== "admin";
                    return (
                      <tr key={l.id} className="border-b">
                        <td className="px-2 py-2 whitespace-nowrap">
                          {l.user?.name || "-"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {l.user?.email || "-"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {l.rastreador?.identificador}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {l.rastreador?.modelo}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          R$ {l.valor.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap font-semibold text-purple-700">
                          {new Date(l.dataVencimento).toLocaleDateString()}
                        </td>
                        <td
                          className={`px-2 py-2 font-bold whitespace-nowrap ${statusClass}`}
                        >
                          {status}
                          {podePagar && (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert("Em breve: link de pagamento!");
                              }}
                              className="ml-2 inline-block px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                              title="Pagar fatura"
                            >
                              Pagar
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
