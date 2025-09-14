"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("../configuracoes/rastreador/RastreadorMap"), {
  ssr: false,
});

export default function RastreamentoCliente() {
  type Rastreador = { id: number; modelo: string; identificador: string };
  type Veiculo = {
    id: number;
    plate: string;
    model: string;
    brand: string;
    year: number;
    rastreadores: Rastreador[];
  };
  type Posicoes = { [id: number]: { lat: number; lng: number } };
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [posicoes, setPosicoes] = useState<Posicoes>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<{
    r: Rastreador;
    pos?: { lat: number; lng: number };
    v?: Veiculo;
  } | null>(null);

  useEffect(() => {
    async function fetchVeiculos() {
      // Busca o token do localStorage ou do cookie
      let token = localStorage.getItem("token");
      if (!token) {
        // Tenta buscar do cookie se não encontrar no localStorage
        const match = document.cookie.match(/auth_token=([^;]+)/);
        if (match) token = match[1];
      }
      if (!token) {
        setError("Token de autenticação não encontrado. Faça login novamente.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/veiculos/meus", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao buscar veículos");
        } else if (data.success && Array.isArray(data.veiculos)) {
          setVeiculos(data.veiculos as Veiculo[]);
        } else {
          setError("Nenhum veículo encontrado ou erro inesperado.");
        }
      } catch (err) {
        setError("Erro de conexão ao buscar veículos.");
      } finally {
        setLoading(false);
      }
    }
    fetchVeiculos();
  }, []);

  useEffect(() => {
    async function fetchPosicoes() {
      const novas: Posicoes = {};
      for (const v of veiculos) {
        for (const r of v.rastreadores) {
          const res = await fetch(
            `/api/rastreador/posicao?imei=${r.identificador}`
          );
          const data = await res.json();
          if (data.success) {
            novas[r.id] = { lat: data.lat, lng: data.lng };
          }
        }
      }
      setPosicoes(novas);
      setLoading(false);
    }
    // Só busca se houver rastreadores
    if (veiculos.some((v) => v.rastreadores.length > 0)) {
      fetchPosicoes();
      const interval = setInterval(fetchPosicoes, 10000);
      return () => clearInterval(interval);
    }
  }, [veiculos]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile && selected && selected.pos) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white shadow-sm">
          <button
            onClick={() => setSelected(null)}
            className="text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-medium"
          >
            Voltar
          </button>
          <div className="flex-1 text-center">
            <div className="text-base font-semibold text-gray-800 truncate">
              {selected.r.modelo}
            </div>
            <div className="text-[11px] text-gray-500">
              IMEI: {selected.r.identificador}
            </div>
          </div>
          <div className="w-16" />
        </div>
        <div className="flex-1 relative">
          <Map lat={selected.pos.lat} lng={selected.pos.lng} />
          <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2 justify-center">
            <button className="px-3 py-2 rounded-lg bg-white shadow text-xs font-medium border hover:bg-gray-50">
              Centralizar
            </button>
            <button className="px-3 py-2 rounded-lg bg-white shadow text-xs font-medium border hover:bg-gray-50">
              Histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6">
          Meus Veículos e Rastreamentos
        </h2>
        {loading ? (
          <div>Carregando...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : veiculos.length === 0 ? (
          <div>Nenhum veículo cadastrado vinculado ao seu usuário.</div>
        ) : (
          <div className="space-y-8">
            {veiculos.map((v) => (
              <div key={v.id} className="border rounded p-4">
                <div className="font-bold text-lg mb-2">
                  {v.plate} - {v.model} ({v.brand}) {v.year}
                </div>
                {v.rastreadores.length === 0 ? (
                  <div className="text-gray-500">
                    Nenhum rastreador vinculado a este veículo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {v.rastreadores.map((r) => (
                      <div
                        key={r.id}
                        className="border rounded p-3 cursor-pointer"
                        onClick={() =>
                          setSelected({ r, pos: posicoes[r.id], v })
                        }
                      >
                        <div className="font-bold">Rastreador: {r.modelo}</div>
                        <div>Identificador (IMEI): {r.identificador}</div>
                        {posicoes[r.id] ? (
                          <div className="w-full h-64 mt-2 rounded overflow-hidden">
                            <Map
                              lat={posicoes[r.id].lat}
                              lng={posicoes[r.id].lng}
                            />
                          </div>
                        ) : (
                          <div className="text-gray-500 mt-2">
                            Aguardando posição...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
