"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";

export default function CadastroVeiculo() {
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [userId, setUserId] = useState("");
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
    fetchUsuarios();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plate,
          model,
          brand,
          year: Number(year),
          userId: Number(userId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar");
      setSuccess(true);
      router.push("/veiculos?success=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white px-3 py-1.5 rounded font-semibold hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 flex items-center gap-2 text-sm shadow"
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
        <h2 className="text-2xl font-bold mb-6">Cadastro de Veículo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Placa</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Modelo</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Ano</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
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
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white py-1.5 rounded font-semibold text-sm hover:from-blue-700 hover:via-blue-600 hover:to-blue-500"
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
