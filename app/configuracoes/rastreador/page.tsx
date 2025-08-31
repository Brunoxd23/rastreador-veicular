"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const QrScanner = dynamic(() => import("react-qr-scanner"), { ssr: false });

export default function CadastroRastreador() {
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
  const [identificadorValido, setIdentificadorValido] = useState(true);
  const [identificadorDuplicado, setIdentificadorDuplicado] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsuarios(data.users);
        }
      } catch {}
    }
    async function fetchVeiculos() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/veiculos", {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  function handleScan(data: any) {
    if (data && data.text && validarIdentificadorFormat(data.text)) {
      setIdentificador(data.text);
      setShowQr(false);
    }
  }
  function handleError(err: any) {
    // Opcional: mostrar erro de leitura
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/configuracoes/rastreador", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Cadastro de Rastreador</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 text-sm font-medium"
            >
              Ler QR Code
            </button>
          </div>
          {showQr && (
            <div className="mt-2">
              <QrScanner
                onScan={handleScan}
                onError={handleError}
                style={{ width: "100%" }}
              />
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
                {v.plate} - {v.model} (ID: {v.id})
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
                {u.name} (ID: {u.id})
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
  );
}
