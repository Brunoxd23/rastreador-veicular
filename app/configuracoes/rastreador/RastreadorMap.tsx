import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface RastreadorMapProps {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Defina o ícone de carro
const carIcon = L.icon({
  iconUrl: "/car-icon.png", // coloque sua imagem em public/car-icon.png
  iconSize: [32, 32], // ajuste o tamanho conforme necessário
  iconAnchor: [16, 32], // ponto de ancoragem do ícone
  popupAnchor: [0, -32],
});

const RastreadorMap: React.FC<RastreadorMapProps> = ({ lat, lng }) => {
  return (
    <div style={containerStyle}>
      <MapContainer
        center={[lat, lng] as [number, number]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CartoDB"
        />
        <Marker position={[lat, lng]} icon={carIcon} />
      </MapContainer>
    </div>
  );
};

export default RastreadorMap;
