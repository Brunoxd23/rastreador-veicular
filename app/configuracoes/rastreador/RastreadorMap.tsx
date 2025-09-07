import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, LayersControl } from "react-leaflet";
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
  // Responsivo: no mobile ocupa 100vw/100vh, no desktop mantém layout bonito
  // Usa hook para detectar mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return (
    <div
      className={
        isMobile
          ? "fixed inset-0 w-screen h-screen z-50 bg-white"
          : "relative w-full h-[70vh] flex items-center justify-center rounded-2xl shadow-xl border-2 border-blue-600 bg-gradient-to-br from-blue-50 via-white to-blue-100 transition-all duration-300"
      }
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
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="© OpenStreetMap contributors © CARTO"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <Marker position={[lat, lng]} icon={carIcon} />
      </MapContainer>
    </div>
  );
};

export default RastreadorMap;
