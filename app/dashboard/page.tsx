"use client";

import React, { useEffect, useState } from "react";
import {
  FiUsers,
  FiTruck,
  FiFileText,
  FiMessageSquare,
  FiSend,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";
import DateCell from "../suporte/DateCell";

interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalInvoices: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
}

const Dashboard = () => {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  // Função para mostrar toast
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };
  const [showModal, setShowModal] = useState(false);
  // Handler para abrir modal de comandos
  const abrirModalComando = () => setShowModal(true);
  const fecharModalComando = () => setShowModal(false);
  // Handlers dos comandos (implementar depois)
  const handleComando = (comando: string) => {
    showToast(`Comando enviado: ${comando}`);
    fecharModalComando();
  };
  // Handler para enviar comando ao rastreador (implementar depois)
  const enviarComando = () => {
    // TODO: implementar lógica de envio de comando para ativar rastreador
    alert("Função de envio de comando ainda não implementada.");
  };
  // Função para atualizar posições manualmente
  const atualizarPosicoes = async () => {
    if (authUser?.role === "client" && veiculos.length > 0) {
      showToast("Atualizando posição...");
      setLoadingVeiculos(true);
      setTimeout(async () => {
        const novas: any = {};
        for (const v of veiculos) {
          if (v.rastreadores && v.rastreadores.length > 0) {
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
        }
        setPosicoes(novas);
        setLoadingVeiculos(false);
      }, 3000); // 3s igual à barra do toast
    }
  };
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVehicles: 0,
    totalInvoices: 0,
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard-stats");
        const data = await res.json();
        if (res.ok && data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        // erro silencioso
      }
    }
    fetchStats();
  }, []);

  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [loadingVeiculos, setLoadingVeiculos] = useState(true);
  interface Posicao {
    lat: number;
    lng: number;
  }
  const [posicoes, setPosicoes] = useState<Record<string, Posicao>>({});
  const [statusRastreador, setStatusRastreador] = useState<{
    bateria: string;
    ligado: boolean;
    ultimaAtualizacao: string;
  } | null>(null);

  // Replace all usages of 'user' with 'authUser' below
  useEffect(() => {
    // Your fetchStats logic here, using authUser instead of user
    // Example:
    // if (authUser?.role === "client") { ... }
  }, [authUser, veiculos]);

  useEffect(() => {
    if (authUser?.role === "client") {
      async function fetchVeiculos() {
        try {
          // Busca veículos do client sem token, usando userId na query string
          if (!authUser) return;
          const res = await fetch(`/api/veiculos/meus?userId=${authUser.id}`);
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
  }, [authUser]);

  useEffect(() => {
    if (authUser?.role === "client" && veiculos.length > 0) {
      async function fetchPosicoesEStatus() {
        const novas: any = {};
        let status = null;
        for (const v of veiculos) {
          if (v.rastreadores && v.rastreadores.length > 0) {
            for (const r of v.rastreadores) {
              const res = await fetch(
                `/api/rastreador/posicao?imei=${r.identificador}`
              );
              const data = await res.json();
              if (data.success) {
                novas[r.id] = { lat: data.lat, lng: data.lng };
              }
              // Buscar status da bateria/ligado
              if (!status) {
                const resStatus = await fetch(
                  `/api/rastreador/status?imei=${r.identificador}`
                );
                const dataStatus = await resStatus.json();
                if (dataStatus.success && dataStatus.status) {
                  status = dataStatus.status;
                }
              }
            }
          }
        }
        setPosicoes(novas);
        setStatusRastreador(status);
      }
      fetchPosicoesEStatus();
      const interval = setInterval(fetchPosicoesEStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [authUser, veiculos]);
  const Map =
    authUser?.role === "client"
      ? require("../configuracoes/rastreador/RastreadorMap").default
      : null;

  // Example card array
  const allCards = [
    {
      title: "Veículos Cadastrados",
      value: stats.totalVehicles,
      icon: FiTruck,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      subtitle: "Total de veículos no sistema",
      route: "/veiculos",
      roles: ["admin", "funcionario"],
    },
    {
      title: "Usuários Cadastrados",
      value: stats.totalUsers,
      icon: FiUsers,
      color: "bg-green-500",
      textColor: "text-green-500",
      subtitle: "Total de usuários no sistema",
      route: "/usuarios",
      roles: ["admin", "funcionario"],
    },
    {
      title: "Faturas",
      value: stats.totalInvoices,
      icon: FiFileText,
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
      subtitle: "",
      route: "/faturas",
      roles: ["admin", "funcionario"],
    },
    {
      title: "Tickets",
      value: `${stats.closedTickets ?? 0}/${stats.totalTickets}`,
      icon: FiMessageSquare,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      subtitle: "Fechados/Total",
      route: "/tickets",
      roles: ["admin", "funcionario", "client"],
    },
  ];

  // Filtra os cards baseado no papel do usuário
  function getCards() {
    return allCards.filter((card) =>
      card.roles.includes(authUser?.role || "client")
    );
  }

  const visibleCards = getCards();

  return (
    <>
      <main className="p-0 md:p-6">
        {/* Toast de feedback */}
        {toast.visible && (
          <div className="fixed bottom-6 right-6 z-[99999] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-4 py-2 rounded shadow-lg flex flex-col min-w-[220px]">
            <span>{toast.message}</span>
            <div className="h-1 mt-2 rounded bg-blue-200 overflow-hidden">
              <div
                className="h-full bg-white animate-toast-bar"
                style={{ width: "100%" }}
              ></div>
            </div>
          </div>
        )}
        {showModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-xl shadow-lg p-6 min-w-[260px] flex flex-col gap-2">
              <h3 className="text-lg font-bold mb-2 text-gray-800">
                Enviar comando
              </h3>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => handleComando("bloquear")}
              >
                Bloquear veículo
              </button>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => handleComando("desbloquear")}
              >
                Desbloquear veículo
              </button>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => showToast("Mostrar histórico em breve")}
              >
                Mostrar histórico
              </button>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => handleComando("localizar")}
              >
                Localizar veículo
              </button>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => handleComando("resetar")}
              >
                Resetar rastreador
              </button>
              <button
                className="px-3 py-2 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition"
                onClick={() => handleComando("solicitar-posicao")}
              >
                Solicitar posição
              </button>
              <button
                className="mt-2 px-3 py-2 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400 transition"
                onClick={fecharModalComando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        {/* Mapa ocupa todo o espaço e card do veículo sobreposto no footer do mapa */}
        {authUser?.role === "client" ? (
          loadingVeiculos ? (
            <div className="flex w-full h-[70vh] items-center justify-center">
              <Loading />
            </div>
          ) : veiculos.length === 0 ? (
            <div className="flex w-full h-[70vh] items-center justify-center">
              <div className="text-gray-500 text-lg">
                Nenhum veículo cadastrado.
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[70vh] flex items-center justify-center rounded-lg shadow-md bg-white">
              <div className="w-full h-full">
                {Map ? (
                  <Map
                    lat={Object.values(posicoes)[0]?.lat ?? -23.64655}
                    lng={Object.values(posicoes)[0]?.lng ?? -46.84985}
                  />
                ) : (
                  <div className="text-gray-500 text-lg">
                    Carregando mapa...
                  </div>
                )}
              </div>
              {/* Card do veículo sobreposto no mapa */}
              <div className="absolute left-6 bottom-6 z-[9999] pointer-events-auto">
                <div className="bg-white rounded-xl shadow-lg px-4 py-3 flex flex-col gap-2 border border-gray-200 min-w-[180px] md:px-8 md:py-5 md:gap-4 md:min-w-[260px]">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-indigo-500"
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
                    <div>
                      <div className="text-base font-bold text-gray-800 md:text-xl">
                        {veiculos[0].model || "Modelo não informado"}
                        {veiculos[0].year ? (
                          <span className="text-base text-gray-500 ml-2">
                            - {veiculos[0].year}
                          </span>
                        ) : null}
                      </div>
                      {veiculos[0].plate && (
                        <div className="text-[10px] text-gray-400 mt-1 md:text-xs">
                          Placa: {veiculos[0].plate}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Status da bateria e ligado/desligado */}
                  {statusRastreador ? (
                    <div className="mb-2 flex gap-4 items-center text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">
                          {(() => {
                            const bateriaNum = parseFloat(
                              statusRastreador.bateria
                            );
                            if (isNaN(bateriaNum)) return "🔋";
                            if (bateriaNum >= 80) return "🔋";
                            if (bateriaNum >= 40) return "🟨";
                            return "🟥";
                          })()}
                        </span>
                        <span className="font-bold text-green-700">
                          {statusRastreador.bateria}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-lg">
                          {statusRastreador.ligado ? "🟢" : "🔴"}
                        </span>
                        {statusRastreador.ligado ? (
                          <span className="text-green-600 font-bold">
                            Ligado
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">
                            Desligado
                          </span>
                        )}
                      </span>
                      <span>
                        Atualizado:{" "}
                        {statusRastreador.ultimaAtualizacao &&
                        !["", "null", "undefined"].includes(
                          String(statusRastreador.ultimaAtualizacao)
                        ) &&
                        new Date(
                          statusRastreador.ultimaAtualizacao
                        ).getFullYear() > 1970 ? (
                          <DateCell date={statusRastreador.ultimaAtualizacao} />
                        ) : (
                          "Sem atualização"
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-2 flex gap-4 items-center text-xs text-gray-500 italic">
                      <span>
                        Sem rastreador cadastrado ou sem dados de status.
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition disabled:opacity-50 shadow"
                      onClick={atualizarPosicoes}
                      disabled={loadingVeiculos}
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Atualizar posição
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 transition disabled:opacity-50 shadow"
                      onClick={abrirModalComando}
                    >
                      <FiSend className="w-4 h-4" />
                      Enviar comando
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 text-blue-900 text-xs font-semibold border border-blue-400 hover:from-blue-500 hover:via-blue-400 hover:to-blue-300 shadow"
                      onClick={() => showToast("Mostrar histórico em breve")}
                    >
                      <FiFileText className="w-4 h-4" />
                      Mostrar histórico
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {visibleCards.map((card, idx) => (
              <div
                key={idx}
                className={`rounded-xl shadow-md p-6 flex flex-col items-start gap-2 ${card.color} bg-opacity-10 border border-gray-200`}
              >
                <card.icon className={`w-8 h-8 ${card.textColor}`} />
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="text-sm text-gray-600">{card.subtitle}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Dashboard;
