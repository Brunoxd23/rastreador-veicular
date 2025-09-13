import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import DateCell from "./DateCell";

interface Posicao {
  lat: number;
  lng: number;
  data: string;
  endereco?: string;
}

interface VeiculoHistoricoMapProps {
  veiculoId: number;
}

export default function VeiculoHistoricoMap({
  veiculoId,
}: VeiculoHistoricoMapProps) {
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistorico() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/veiculos/historico?veiculoId=${veiculoId}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.posicoes)) {
          setPosicoes(data.posicoes);
        }
      } catch {}
      setLoading(false);
    }
    if (veiculoId) fetchHistorico();
  }, [veiculoId]);

  if (loading)
    return (
      <div className="text-center text-gray-400">Carregando histórico...</div>
    );
  if (!posicoes.length)
    return (
      <div className="text-center text-gray-400">
        Nenhuma posição encontrada.
      </div>
    );

  const center: [number, number] = [posicoes[0].lat, posicoes[0].lng];
  const polyline: [number, number][] = posicoes.map((p) => [p.lat, p.lng]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={polyline} color="blue" />
      {posicoes.map((p, idx) => (
        <Marker key={idx} position={[p.lat, p.lng]}>
          <Popup>
            <div>
              <div>
                <b>Data:</b> <DateCell date={p.data} />
              </div>
              {p.endereco && (
                <div>
                  <b>Endereço:</b> {p.endereco}
                </div>
              )}
              <div>
                <b>Lat:</b> {p.lat}
              </div>
              <div>
                <b>Lng:</b> {p.lng}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
