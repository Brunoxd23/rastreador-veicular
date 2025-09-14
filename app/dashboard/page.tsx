"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FiUsers,
  FiTruck,
  FiFileText,
  FiMessageSquare,
  FiSend,
  FiRefreshCw,
  FiMaximize2,
  FiMinimize2,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import MobileBottomNav from "../components/MobileBottomNav";
import Loading from "../components/Loading";
import DateCell from "../suporte/DateCell";
import MobileMapView from "./MobileMapView";

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
  // fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Vehicle card show/hide & drag
  const [showVehicleCard, setShowVehicleCard] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardPos, setCardPos] = useState({ x: 24, y: 24 });
  const [isMobile, setIsMobile] = useState(false);
  const dragData = useRef<{
    offsetX: number;
    offsetY: number;
    dragging: boolean;
  }>({
    offsetX: 0,
    offsetY: 0,
    dragging: false,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    dragData.current.dragging = true;
    const rect = cardRef.current.getBoundingClientRect();
    dragData.current.offsetX = e.clientX - rect.left;
    dragData.current.offsetY = e.clientY - rect.top;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragData.current.dragging) return;
    const newX = e.clientX - dragData.current.offsetX;
    const newY = e.clientY - dragData.current.offsetY;
    if (typeof window !== "undefined") {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = cardRef.current?.offsetWidth || 0;
      const h = cardRef.current?.offsetHeight || 0;
      // Mobile modo normal: permitir arraste vertical livre (limitado) e horizontal leve
      if (isMobile && !isFullscreen) {
        const navEl = document.querySelector("[data-mobile-nav]");
        const navH = navEl instanceof HTMLElement ? navEl.offsetHeight + 8 : 82;
        const maxY = vh - navH - h - 8;
        const clampedX = Math.min(Math.max(8, newX), vw - w - 8);
        const clampedY = Math.min(Math.max(60, newY), maxY < 60 ? 60 : maxY);
        setCardPos({ x: clampedX, y: clampedY });
        return;
      }
      // Desktop ou fullscreen: impedir que saia da tela
      const clampedX = Math.min(Math.max(8, newX), vw - w - 8);
      const clampedY = Math.min(Math.max(70, newY), vh - h - 16);
      setCardPos({ x: clampedX, y: clampedY });
    } else {
      setCardPos({ x: newX, y: newY });
    }
  };
  // Ajusta posição inicial em mobile mais para baixo
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Recalcula posição depois de render para mobile (usar altura real)
  useEffect(() => {
    if (!isMobile || !cardRef.current || isFullscreen) return;
    const h = cardRef.current.getBoundingClientRect().height;
    const navEl = document.querySelector("[data-mobile-nav]");
    const navH = navEl instanceof HTMLElement ? navEl.offsetHeight + 8 : 110;
    const y = window.innerHeight - h - navH; // espaço nav + margem
    setCardPos({ x: 12, y: y < 60 ? 60 : y });
  }, [isMobile, veiculos, showVehicleCard, isFullscreen]);
  const handlePointerUp = (e: React.PointerEvent) => {
    dragData.current.dragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

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
        {/* Mapa / Cards */}
        {authUser?.role === "client" ? (
          isMobile ? (
            <MobileMapView
              veiculos={veiculos}
              loadingVeiculos={loadingVeiculos}
              posicoes={posicoes}
              statusRastreador={statusRastreador}
              atualizarPosicoes={atualizarPosicoes}
              show={showVehicleCard}
              onClose={() => setShowVehicleCard(false)}
              onReopen={() => setShowVehicleCard(true)}
            />
          ) : loadingVeiculos ? (
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
            <div
              className={`relative w-full h-[70vh] flex items-center justify-center rounded-lg shadow-md bg-white overflow-hidden ${
                isFullscreen
                  ? "fixed inset-0 z-[9998] h-screen w-screen rounded-none !m-0"
                  : ""
              }`}
            >
              <div className="absolute top-3 right-3 z-[10001] flex gap-2">
                <button
                  onClick={() => setIsFullscreen((f) => !f)}
                  className="p-2 rounded bg-white/90 backdrop-blur border shadow hover:bg-white transition"
                  title={isFullscreen ? "Sair tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? (
                    <FiMinimize2 className="w-4 h-4" />
                  ) : (
                    <FiMaximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
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
              {showVehicleCard && (
                <div
                  ref={cardRef}
                  style={{ left: cardPos.x, top: cardPos.y }}
                  className="absolute z-[10000] pointer-events-auto"
                >
                  <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex flex-col gap-4 border border-gray-200 md:min-w-[260px] min-w-[240px]">
                    <div
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="flex items-start cursor-grab active:cursor-grabbing -mt-1"
                    >
                      <h3 className="text-sm font-semibold text-gray-700">
                        {veiculos[0]?.model || "Veículo"}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVehicleCard(false);
                        }}
                        className="ml-auto p-1 rounded hover:bg-gray-100 text-gray-500"
                        title="Fechar"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
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
                        <span className="text-[11px]">
                          {statusRastreador.ultimaAtualizacao &&
                          new Date(
                            statusRastreador.ultimaAtualizacao
                          ).getFullYear() > 1970 ? (
                            <DateCell
                              date={statusRastreador.ultimaAtualizacao}
                            />
                          ) : (
                            "Sem atualização"
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2 text-xs text-gray-500 italic">
                        Sem dados de status.
                      </div>
                    )}
                    {!isFullscreen && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold shadow"
                          onClick={atualizarPosicoes}
                          disabled={loadingVeiculos}
                        >
                          <FiRefreshCw className="w-4 h-4" /> Atualizar
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold shadow"
                          onClick={abrirModalComando}
                        >
                          <FiSend className="w-4 h-4" /> Comando
                        </button>
                        <button
                          className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 text-blue-900 text-xs font-semibold border border-blue-400 shadow"
                          onClick={() => showToast("Histórico em breve")}
                        >
                          <FiFileText className="w-4 h-4" /> Histórico
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!showVehicleCard && (
                <button
                  onClick={() => setShowVehicleCard(true)}
                  className="absolute left-6 bottom-6 z-[10000] p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white"
                  title="Mostrar card"
                >
                  <FiTruck className="w-5 h-5" />
                </button>
              )}
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
        {!isFullscreen && <MobileBottomNav />}
      </main>
    </>
  );
};

export default Dashboard;
