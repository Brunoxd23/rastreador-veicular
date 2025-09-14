"use client";
import React, { useEffect, useRef, useState } from "react";
import { FiFileText, FiRefreshCw, FiSend, FiX, FiTruck } from "react-icons/fi";
import DateCell from "../suporte/DateCell";
import Loading from "../components/Loading";

interface Posicao {
  lat: number;
  lng: number;
}
interface StatusRastreador {
  bateria: string;
  ligado: boolean;
  ultimaAtualizacao: string;
}
interface MobileMapViewProps {
  veiculos: any[];
  loadingVeiculos: boolean;
  posicoes: Record<string, Posicao>;
  statusRastreador: StatusRastreador | null;
  atualizarPosicoes: () => void | Promise<void>;
  show: boolean;
  onClose: () => void;
  onReopen?: () => void;
}

const MobileMapView: React.FC<MobileMapViewProps> = ({
  veiculos,
  loadingVeiculos,
  posicoes,
  statusRastreador,
  atualizarPosicoes,
  show,
  onClose,
  onReopen,
}) => {
  const Map = require("../configuracoes/rastreador/RastreadorMap").default;
  // Bottom sheet estados
  type SheetState = "collapsed" | "half" | "expanded";
  const [sheetState, setSheetState] = useState<SheetState>("collapsed");
  const [sheetY, setSheetY] = useState(0);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const dragData = useRef({ startY: 0, startSheetY: 0, dragging: false });

  // Calcular alturas dinamicamente
  const computeHeights = () => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return {
      collapsed: 140,
      half: Math.round(vh * 0.45),
      expanded: Math.round(vh * 0.82),
    };
  };

  const snapTo = (state: SheetState) => {
    const vh = window.innerHeight;
    const heights = computeHeights();
    const h = heights[state];
    setSheetY(vh - h);
    setSheetState(state);
  };

  // Inicial
  useEffect(() => {
    if (loadingVeiculos) return;
    snapTo("collapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingVeiculos]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragData.current.dragging = true;
    dragData.current.startY = e.clientY;
    dragData.current.startSheetY = sheetY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragData.current.dragging) return;
    const delta = e.clientY - dragData.current.startY;
    const vh = window.innerHeight;
    const heights = computeHeights();
    const minY = vh - heights.expanded; // topo limite
    const maxY = vh - heights.collapsed; // fundo limite
    let next = dragData.current.startSheetY + delta;
    if (next < minY) next = minY;
    if (next > maxY) next = maxY;
    setSheetY(next);
  };
  const handlePointerUp = () => {
    if (!dragData.current.dragging) return;
    dragData.current.dragging = false;
    // decidir snap mais próximo
    const vh = window.innerHeight;
    const heights = computeHeights();
    const positions: [SheetState, number][] = [
      ["expanded", vh - heights.expanded],
      ["half", vh - heights.half],
      ["collapsed", vh - heights.collapsed],
    ];
    const current = sheetY;
    let best: SheetState = sheetState;
    let bestDist = Infinity;
    positions.forEach(([state, y]) => {
      const d = Math.abs(y - current);
      if (d < bestDist) {
        bestDist = d;
        best = state;
      }
    });
    setTimeout(() => snapTo(best), 10);
  };

  // Atualizar posição ao redimensionar
  useEffect(() => {
    const onResize = () => {
      snapTo(sheetState);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [sheetState]);

  if (!show) {
    return (
      <>
        <div className="absolute left-4 bottom-24 z-[12001]">
          <button
            onClick={() => {
              onReopen && onReopen();
            }}
            className="p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white"
            title="Mostrar card"
          >
            <FiTruck className="w-5 h-5" />
          </button>
        </div>
        <div className="relative w-full h-screen overflow-hidden">
          <div className="absolute inset-0">
            {loadingVeiculos ? (
              <div className="flex w-full h-full items-center justify-center">
                <Loading />
              </div>
            ) : veiculos.length === 0 ? (
              <div className="flex w-full h-full items-center justify-center text-gray-500">
                Nenhum veículo cadastrado.
              </div>
            ) : (
              <Map
                lat={Object.values(posicoes)[0]?.lat ?? -23.64655}
                lng={Object.values(posicoes)[0]?.lng ?? -46.84985}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0">
        {loadingVeiculos ? (
          <div className="flex w-full h-full items-center justify-center">
            <Loading />
          </div>
        ) : veiculos.length === 0 ? (
          <div className="flex w-full h-full items-center justify-center text-gray-500">
            Nenhum veículo cadastrado.
          </div>
        ) : (
          <Map
            lat={Object.values(posicoes)[0]?.lat ?? -23.64655}
            lng={Object.values(posicoes)[0]?.lng ?? -46.84985}
          />
        )}
      </div>
      {/* Sheet */}
      <div
        ref={dragRef}
        style={{ top: sheetY }}
        className="absolute left-0 right-0 z-[11000] bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col transition-[top] duration-150 will-change-[top]"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-300" />
          {/* Cabeçalho veículo */}
          {veiculos.length > 0 && (
            <div className="flex items-start gap-3">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-500 mt-0.5"
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
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-800 leading-snug">
                  {veiculos[0].model || "Modelo não informado"}
                  {veiculos[0].year && (
                    <span className="text-sm text-gray-500 ml-2">
                      - {veiculos[0].year}
                    </span>
                  )}
                </div>
                {veiculos[0].plate && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    Placa: {veiculos[0].plate}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    snapTo(sheetState === "collapsed" ? "half" : "collapsed")
                  }
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  title="Minimizar / Meio"
                >
                  <span className="text-xs font-bold">
                    {sheetState === "collapsed" ? "↑" : "↓"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500"
                  title="Fechar"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Conteúdo scroll */}
        <div
          className="px-4 pb-4 overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {statusRastreador ? (
            <div className="mb-3 flex gap-4 items-center text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="text-lg">
                  {(() => {
                    const bateriaNum = parseFloat(statusRastreador.bateria);
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
                  <span className="text-green-600 font-bold">Ligado</span>
                ) : (
                  <span className="text-red-600 font-bold">Desligado</span>
                )}
              </span>
              <span>
                Atualizado:{" "}
                {statusRastreador.ultimaAtualizacao &&
                new Date(statusRastreador.ultimaAtualizacao).getFullYear() >
                  1970 ? (
                  <DateCell date={statusRastreador.ultimaAtualizacao} />
                ) : (
                  "Sem atualização"
                )}
              </span>
            </div>
          ) : (
            <div className="mb-3 text-xs text-gray-500 italic">
              Sem rastreador cadastrado ou sem dados de status.
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold shadow"
              onClick={atualizarPosicoes}
            >
              <FiRefreshCw className="w-4 h-4" /> Atualizar posição
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white text-xs font-semibold shadow"
              onClick={() => alert("Enviar comando (implementar)")}
            >
              <FiSend className="w-4 h-4" /> Enviar comando
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 text-blue-900 text-xs font-semibold border border-blue-400 shadow"
              onClick={() => alert("Mostrar histórico em breve")}
            >
              <FiFileText className="w-4 h-4" /> Histórico
            </button>
          </div>
          <div className="mt-4 text-[11px] text-gray-400 text-center select-none">
            Arraste para ampliar • Toque para minimizar
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMapView;
