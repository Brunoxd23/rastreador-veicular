"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

const OPERADORAS = [
  { nome: "Vivo", apn: "zap.vivo.com.br", usuario: "vivo", senha: "vivo" },
  { nome: "Claro", apn: "claro.com.br", usuario: "claro", senha: "claro" },
  { nome: "Tim", apn: "tim.br", usuario: "tim", senha: "tim" },
  { nome: "Oi", apn: "gprs.oi.com.br", usuario: "oi", senha: "oi" },
];

export default function AtivacaoRastreador() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin" && user.role !== "funcionario") {
      router.replace("/dashboard");
    }
  }, [user, router]);
  const [imei, setImei] = useState("");
  const [ip, setIp] = useState("");
  const [porta, setPorta] = useState("9000");
  const [operadora, setOperadora] = useState(OPERADORAS[0]);
  const [intervalo, setIntervalo] = useState("120");
  const [timer, setTimer] = useState("1800");
  const [gmt, setGmt] = useState("W");
  const [chip, setChip] = useState("");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const comandos = [
    `APN,${operadora.apn},${operadora.usuario},${operadora.senha}#`,
    `SERVER,0,${ip || "IP_DO_SEU_SERVIDOR"},${porta},0#`,
    `GMT,${gmt},0#`,
    `TIMER,${intervalo},${timer}#`,
  ];

  async function enviarSMS(comando: string) {
    setSmsStatus("Enviando...");
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: chip, message: comando }),
      });
      const data = await res.json();
      if (data.success) {
        setSmsStatus("SMS enviado com sucesso!");
      } else {
        setSmsStatus(
          "Falha ao enviar SMS: " + (data.error || "Erro desconhecido")
        );
      }
    } catch (err) {
      setSmsStatus("Erro ao enviar SMS");
    }
    setTimeout(() => setSmsStatus(null), 4000);
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">
        Ativação do Rastreador
      </h2>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Número do chip M2 (com DDD)
          </label>
          <input
            type="text"
            value={chip}
            onChange={(e) => setChip(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: +5511999999999"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IMEI do Rastreador
          </label>
          <input
            type="text"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Digite o IMEI"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IP do Servidor
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: 189.45.123.10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Porta
          </label>
          <input
            type="text"
            value={porta}
            onChange={(e) => setPorta(e.target.value)}
            className="mt-1 block w-32 rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Operadora do Chip
          </label>
          <select
            value={operadora.nome}
            onChange={(e) =>
              setOperadora(
                OPERADORAS.find((o) => o.nome === e.target.value) ||
                  OPERADORAS[0]
              )
            }
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {OPERADORAS.map((o) => (
              <option key={o.nome} value={o.nome}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Intervalo (segundos)
            </label>
            <input
              type="text"
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              className="mt-1 block w-24 rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Timer (segundos)
            </label>
            <input
              type="text"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="mt-1 block w-24 rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timezone (GMT)
          </label>
          <input
            type="text"
            value={gmt}
            onChange={(e) => setGmt(e.target.value)}
            className="mt-1 block w-24 rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </form>
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Comandos para ativação:
        </h3>
        <div className="bg-gray-50 rounded p-4 text-sm font-mono text-gray-700">
          {comandos.map((cmd, idx) => (
            <div
              key={idx}
              className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <span>{cmd}</span>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  onClick={() => navigator.clipboard.writeText(cmd)}
                  type="button"
                >
                  Copiar
                </button>
                <button
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  onClick={() => enviarSMS(cmd)}
                  type="button"
                  disabled={!chip || smsStatus === "Enviando..."}
                >
                  Enviar SMS
                </button>
              </div>
            </div>
          ))}
        </div>
        {smsStatus && (
          <div className="mt-2 text-sm text-center text-indigo-600">
            {smsStatus}
          </div>
        )}
      </div>
    </div>
  );
}
