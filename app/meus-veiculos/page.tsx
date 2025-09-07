"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";

const MeusVeiculos = () => {
  const { user } = useAuth();
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  const [selectedRastreador, setSelectedRastreador] = useState<any | null>(
    null
  );
  const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const Map = dynamic(
    () => import("../configuracoes/rastreador/RastreadorMap"),
    { ssr: false }
  );
  // Busca posição do rastreador selecionado
  useEffect(() => {
    async function fetchPosicao() {
      if (selectedRastreador) {
        const res = await fetch(
          `/api/rastreador/posicao?imei=${selectedRastreador.identificador}`
        );
        const data = await res.json();
        if (data.success && data.lat && data.lng) {
          setPosicao({ lat: data.lat, lng: data.lng });
        } else {
          setPosicao(null);
        }
      }
    }
    fetchPosicao();
  }, [selectedRastreador]);

  useEffect(() => {
    if (user?.role === "client") {
      async function fetchVeiculos() {
        try {
          if (!user) return;
          const res = await fetch(`/api/veiculos/meus?userId=${user.id}`);
          const data = await res.json();
          if (res.ok && data.success && Array.isArray(data.veiculos)) {
            setVeiculos(data.veiculos);
          }
        } catch {
          // Se erro, não trava loading
        } finally {
          setLoadingVeiculos(false);
        }
      }
      fetchVeiculos();
    }
  }, [user]);

  return (
    <div>
      <main className="p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Meus Veículos
        </h2>
        {loadingVeiculos ? (
          <Loading />
        ) : veiculos.length === 0 ? (
          <p className="text-gray-600">
            Nenhum veículo cadastrado vinculado ao seu usuário.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {veiculos.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg hover:shadow-xl transition flex flex-col gap-2"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-100 rounded-full p-2">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="6"
                        rx="2"
                        fill="#e0e7ff"
                      />
                      <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
                      <circle cx="7.5" cy="17.5" r="1.5" fill="#6366f1" />
                      <circle cx="16.5" cy="17.5" r="1.5" fill="#6366f1" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {v.model || "Modelo não informado"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {v.brand} {v.year}
                    </div>
                    <div className="text-xs text-gray-400">
                      Placa: {v.plate}
                    </div>
                  </div>
                </div>
                {v.rastreadores && v.rastreadores.length > 0 ? (
                  <div className="mt-2">
                    <h4 className="font-semibold mb-2 text-indigo-600">
                      Rastreadores vinculados
                    </h4>
                    <div className="flex flex-col gap-2">
                      {v.rastreadores.map((r: any) => (
                        <div
                          key={r.id}
                          className={`border rounded-lg p-3 cursor-pointer transition hover:bg-indigo-50 ${
                            selectedRastreador?.id === r.id
                              ? "border-indigo-400 bg-indigo-50"
                              : "border-gray-200 bg-white"
                          }`}
                          onClick={() => setSelectedRastreador(r)}
                        >
                          <div className="font-bold text-indigo-700">
                            {r.modelo}
                          </div>
                          <div className="text-xs text-gray-500">
                            IMEI: {r.identificador}
                          </div>
                          {selectedRastreador?.id === r.id && posicao ? (
                            <div className="w-full h-48 mt-2 rounded overflow-hidden">
                              <Map lat={posicao.lat} lng={posicao.lng} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Nenhum rastreador vinculado a este veículo.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MeusVeiculos;
