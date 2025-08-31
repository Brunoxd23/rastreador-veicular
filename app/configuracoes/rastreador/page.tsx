"use client";

import { useState, useEffect, useRef } from "react";
import { useRef as useToastRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import Header from "../../components/Header";
import Loading from "../../components/Loading";
// Toast notification
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
      {message}
    </div>
  );
}
import { QrCodeIcon } from "@heroicons/react/24/outline";

export default function CadastroRastreador() {
  // Ativação do chip
  const [showAtivarChip, setShowAtivarChip] = useState(false);
  const [chip, setChip] = useState("");
  const [operadora, setOperadora] = useState("Vivo");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const OPERADORAS = [
    { nome: "Vivo", apn: "zap.vivo.com.br", usuario: "vivo", senha: "vivo" },
    { nome: "Claro", apn: "claro.com.br", usuario: "claro", senha: "claro" },
    { nome: "Tim", apn: "tim.br", usuario: "tim", senha: "tim" },
    { nome: "Oi", apn: "gprs.oi.com.br", usuario: "oi", senha: "oi" },
  ];
  const [ip, setIp] = useState("");
  const [porta, setPorta] = useState("9000");
  const [intervalo, setIntervalo] = useState("120");
  const [timer, setTimer] = useState("1800");
  const [gmt, setGmt] = useState("W");

  const comandos = [
    `APN,${
      OPERADORAS.find((o) => o.nome === operadora)?.apn || "zap.vivo.com.br"
    },${OPERADORAS.find((o) => o.nome === operadora)?.usuario || "vivo"},${
      OPERADORAS.find((o) => o.nome === operadora)?.senha || "vivo"
    }#`,
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
  const [showToast, setShowToast] = useState(false);
  const Map = dynamic(() => import("./RastreadorMap"), { ssr: false });
  const [modelo, setModelo] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [userId, setUserId] = useState("");
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([]);
  const [veiculos, setVeiculos] = useState<
    { id: number; plate: string; model: string }[]
  >([]);
  const [valorLicenca, setValorLicenca] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showAtivacao, setShowAtivacao] = useState(false);
  const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [identificadorValido, setIdentificadorValido] = useState(true);
  const [identificadorDuplicado, setIdentificadorDuplicado] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrError, setQrError] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsuarios(data.users);
        }
      } catch {}
    }
    async function fetchVeiculos() {
      try {
        const res = await fetch("/api/veiculos");
        const data = await res.json();
        if (data.success && Array.isArray(data.vehicles)) {
          setVeiculos(data.vehicles);
        }
      } catch {}
    }
    fetchUsuarios();
    fetchVeiculos();
  }, []);

  // Validação de formato IMEI
  function validarIdentificadorFormat(value: string) {
    return /^\d{15}$/.test(value);
  }

  // Verifica duplicidade no backend
  async function verificarDuplicidade(identificador: string) {
    if (!validarIdentificadorFormat(identificador)) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `/api/configuracoes/rastreador?identificador=${identificador}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setIdentificadorDuplicado(data.exists === true);
  }

  useEffect(() => {
    if (identificador.length === 15) {
      setIdentificadorValido(validarIdentificadorFormat(identificador));
      verificarDuplicidade(identificador);
    } else {
      setIdentificadorValido(true);
      setIdentificadorDuplicado(false);
    }
  }, [identificador]);

  // QR code scanner
  useEffect(() => {
    if (showQr && qrRef.current) {
      async function buscarPosicao(imei: string) {
        // Simulação: buscar posição pelo IMEI
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/rastreador/posicao?imei=${imei}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && data.lat && data.lng) {
            setPosicao({ lat: data.lat, lng: data.lng });
          }
        } catch {}
      }
      setQrError("");
      const scanner = new Html5QrcodeScanner(
        qrRef.current.id,
        { fps: 10, qrbox: 250 },
        false
      );
      scanner.render(
        (decodedText: string) => {
          if (validarIdentificadorFormat(decodedText)) {
            setIdentificador(decodedText);
            setShowQr(false);
            scanner.clear();
          } else {
            setQrError("QR inválido ou não é IMEI.");
          }
        },
        (error: any) => {
          setQrError("Erro ao ler QR Code.");
        }
      );
      return () => {
        scanner.clear();
      };
    }
  }, [showQr]);

  async function buscarPosicao(imei: string) {
    // Simulação: buscar posição pelo IMEI
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rastreador/posicao?imei=${imei}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.lat && data.lng) {
        setPosicao({ lat: data.lat, lng: data.lng });
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/configuracoes/rastreador", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelo,
          identificador,
          vehicleId: Number(vehicleId),
          userId: Number(userId),
          valorLicenca: Number(valorLicenca),
          dataVencimento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar");
      setSuccess(true);
      setShowAtivacao(true);
      setShowToast(true);
      buscarPosicao(identificador);
      setModelo("");
      setIdentificador("");
      setVehicleId("");
      setUserId("");
      setValorLicenca("");
      setDataVencimento("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showToast && (
        <Toast
          message="Rastreador cadastrado com sucesso!"
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar
        </button>
        <h2 className="text-2xl font-bold mb-6">Cadastro de Rastreador</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Botão para ativar chip após cadastro */}
          <button
            type="button"
            className="w-full bg-green-600 text-white py-2 rounded font-bold mt-2"
            onClick={() => setShowAtivarChip(true)}
          >
            Ativar Chip
          </button>
          {/* Modal de ativação do chip */}
          {showAtivarChip && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowAtivarChip(false)}
                >
                  &times;
                </button>
                <h3 className="text-xl font-bold mb-4 text-indigo-700">
                  Ativação do Chip M2
                </h3>
                <div className="mb-3">
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
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Operadora do Chip
                  </label>
                  <select
                    value={operadora}
                    onChange={(e) => setOperadora(e.target.value)}
                    className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {OPERADORAS.map((o) => (
                      <option key={o.nome} value={o.nome}>
                        {o.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
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
                <div className="mb-3">
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
                <div className="flex gap-4 mb-3">
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
                <div className="mb-3">
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
                <h4 className="text-md font-semibold mb-2 mt-4">
                  Comandos para ativação:
                </h4>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 mb-2">
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
                  {/* Botão RESET do rastreador */}
                  <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <span className="font-bold text-red-600">RESET#</span>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        onClick={() => navigator.clipboard.writeText("RESET#")}
                        type="button"
                      >
                        Copiar
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={() => enviarSMS("RESET#")}
                        type="button"
                        disabled={!chip || smsStatus === "Enviando..."}
                      >
                        Enviar RESET
                      </button>
                    </div>
                  </div>
                </div>
                {smsStatus && (
                  <div className="mt-2 text-sm text-center text-indigo-600">
                    {smsStatus}
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block font-medium">Modelo</label>
            <input
              type="text"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Identificador (IMEI)</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={identificador}
                onChange={(e) =>
                  setIdentificador(e.target.value.replace(/[^\d]/g, ""))
                }
                maxLength={15}
                className={`w-full border rounded px-3 py-2 ${
                  !identificadorValido || identificadorDuplicado
                    ? "border-red-500"
                    : ""
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="flex items-center gap-1 bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium hover:bg-gray-300 transition-colors text-xs"
                style={{ minWidth: 90 }}
              >
                <QrCodeIcon className="w-4 h-4" />
                Ler QR Code
              </button>
            </div>
            {showQr && (
              <div className="mt-2 flex flex-col items-center">
                <div
                  id="qr-reader"
                  ref={qrRef}
                  style={{ width: 320, maxWidth: "100%" }}
                />
                {qrError && <div className="text-red-600 mt-2">{qrError}</div>}
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
                >
                  Cancelar
                </button>
              </div>
            )}
            {!identificadorValido && (
              <span className="text-red-600 text-sm">
                O identificador deve conter 15 dígitos numéricos.
              </span>
            )}
            {identificadorDuplicado && (
              <span className="text-red-600 text-sm">
                Este identificador já está cadastrado.
              </span>
            )}
          </div>
          <div>
            <label className="block font-medium">Veículo</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selecione o veículo</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} - {v.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Usuário</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Selecione o usuário</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Valor da Licença</label>
            <input
              type="number"
              value={valorLicenca}
              onChange={(e) => setValorLicenca(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Data de Vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-bold"
            disabled={loading}
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {success && (
            <div className="text-green-600 mt-2">
              Cadastro realizado com sucesso!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
