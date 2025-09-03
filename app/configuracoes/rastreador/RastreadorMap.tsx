import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface RastreadorMapProps {
  lat: number;
  lng: number;
}

// Usando Tailwind para responsividade e visual moderno
const containerStyle = {};

// Ícone profissional de carro rastreado (SVG)
const carIcon = L.icon({
  iconUrl: "/tracker-car.svg", // SVG fornecido pelo usuário
  iconSize: [64, 53], // tamanho proporcional ao SVG
  iconAnchor: [32, 53], // âncora na base do carro
  popupAnchor: [0, -53],
  className: "leaflet-car-marker",
});

const RastreadorMap: React.FC<RastreadorMapProps> = ({ lat, lng }) => {
  return (
    <div
      className="relative w-full h-[70vh] flex items-center justify-center rounded-2xl shadow-xl border-2 border-blue-600 bg-gradient-to-br from-blue-50 via-white to-blue-100 transition-all duration-300"
      style={containerStyle}
    >
      <MapContainer
        center={[lat, lng] as [number, number]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="MoviTrace"
        />
        <Marker position={[lat, lng]} icon={carIcon} />
      </MapContainer>
    </div>
  );
};

export default RastreadorMap;
