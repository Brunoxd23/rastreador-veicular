import React, { useEffect, useState } from "react";
import Loading from "./Loading";

interface Veiculo {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: string;
}

interface VeiculosClientProps {
  userId: string;
}

const VeiculosClient: React.FC<VeiculosClientProps> = ({ userId }) => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVeiculos() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/veiculos/meus", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao buscar veículos");
        } else if (data.success && Array.isArray(data.veiculos)) {
          setVeiculos(data.veiculos);
        } else {
          setError("Nenhum veículo encontrado ou erro inesperado.");
        }
      } catch {
        setError("Erro ao buscar veículos");
      } finally {
        setLoading(false);
      }
    }
    fetchVeiculos();
  }, [userId]);

  return (
    <div>
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Meus Veículos</h2>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : veiculos.length === 0 ? (
          <p className="text-gray-600">Nenhum veículo cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {veiculos.map((v) => (
              <div
                key={v.id}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{v.plate}</span>
                </div>
                <div className="text-gray-700">
                  Modelo: <span className="font-medium">{v.model}</span>
                </div>
                <div className="text-gray-700">
                  Marca: <span className="font-medium">{v.brand}</span>
                </div>
                <div className="text-gray-700">
                  Ano: <span className="font-medium">{v.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VeiculosClient;
