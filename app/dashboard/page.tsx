"use client";

import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { FiUsers, FiTruck, FiFileText, FiMessageSquare } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";

interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalInvoices: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
}

const Dashboard = () => {
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
      async function fetchPosicoes() {
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
      }
      fetchPosicoes();
      const interval = setInterval(fetchPosicoes, 10000);
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
      <Header />
      <main className="p-0 md:p-6">
        {/* Mapa ocupa todo o espaço e card do veículo sobreposto no footer do mapa */}
        {authUser?.role === "client" ? (
          <div className="relative w-full h-[70vh] flex items-center justify-center rounded-lg shadow-md bg-white">
            <div className="w-full h-full pointer-events-none">
              {Map &&
              veiculos.length > 0 &&
              Object.keys(posicoes).length > 0 ? (
                <Map
                  lat={Object.values(posicoes)[0]?.lat || -15.7801}
                  lng={Object.values(posicoes)[0]?.lng || -47.9292}
                />
              ) : (
                <div className="text-gray-500 text-lg">
                  Nenhuma posição encontrada
                </div>
              )}
            </div>
            {/* Card do veículo sobreposto no footer do mapa, sempre visível */}
            <div className="absolute left-6 bottom-6 z-[9999] pointer-events-auto">
              <div className="bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-2 border border-gray-200 min-w-[180px] md:px-8 md:py-5 md:gap-4 md:min-w-[260px]">
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
                    {veiculos.length > 0
                      ? veiculos[0].model || "Modelo não informado"
                      : "Meu Painel"}
                    {veiculos.length > 0 && veiculos[0].year ? (
                      <span className="text-base text-gray-500 ml-2">
                        - {veiculos[0].year}
                      </span>
                    ) : null}
                  </div>
                  {veiculos.length > 0 && veiculos[0].plate && (
                    <div className="text-[10px] text-gray-400 mt-1 md:text-xs">
                      Placa: {veiculos[0].plate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-full ${card.color} bg-opacity-20`}
                    >
                      <card.icon className={`w-6 h-6 ${card.textColor}`} />
                    </div>
                    <span className="text-2xl font-bold text-gray-800">
                      {card.value}
                    </span>
                  </div>
                  <h3 className="text-gray-600 font-medium">{card.title}</h3>
                  {card.subtitle && (
                    <p className="text-sm text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Seção para gráficos futuros - apenas para admin e funcionário */}
            {(authUser?.role === "admin" ||
              authUser?.role === "funcionario") && (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Atividade Recente
                  </h3>
                  <p className="text-gray-600">
                    Área reservada para gráfico de atividades
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Estatísticas
                  </h3>
                  <p className="text-gray-600">
                    Área reservada para mais estatísticas
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default Dashboard;
