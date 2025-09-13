import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import DateCell from "../../suporte/DateCell";
import "leaflet/dist/leaflet.css";

interface Posicao {
  lat: number;
  lng: number;
  data: string;
  endereco?: string;
}

interface RastreadorHistoricoMapProps {
  imei: string;
}

export default function RastreadorHistoricoMap({
  imei,
}: RastreadorHistoricoMapProps) {
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistorico() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rastreador/historico?imei=${imei}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.posicoes)) {
          setPosicoes(data.posicoes);
        }
      } catch {}
      setLoading(false);
    }
    if (imei) fetchHistorico();
  }, [imei]);

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

  const center: [number, number] =
    posicoes.length > 0 ? [posicoes[0].lat, posicoes[0].lng] : [0, 0];
  const polyline = posicoes.map((p) => [p.lat, p.lng] as [number, number]);

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
