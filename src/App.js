import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Configuration des icônes personnalisées par couleur
// Cela permet au jury de distinguer les lignes instantanément
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const busIcons = {
  '219B': createIcon('gold'),   // Jaune pour la 219B
  '7': createIcon('blue'),      // Bleu pour la 7
  '218': createIcon('green'),   // Vert pour la 218
  'default': createIcon('red')
};

function App() {
  const [buses, setBuses] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  // 2. Fonction de récupération des données (Fetch)
  const fetchBusData = async () => {
    try {
      // Appel vers ton script PHP sur XAMPP
      const response = await fetch('http://localhost/test.php');
      const data = await response.json();
      
      setBuses(data);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log("Mise à jour de la flotte effectuée");
    } catch (error) {
      console.error("Erreur API:", error);
    }
  };

  // 3. Cycle de vie : Chargement initial et rafraîchissement automatique
  useEffect(() => {
    fetchBusData();
    
    // Simulation du temps réel : rafraîchissement toutes les 5 secondes
    const interval = setInterval(fetchBusData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Professionnel pour le prototype */}
      <header style={{ 
        padding: '15px', 
        background: '#1a2a3a', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>SamaBus Dakar - Monitoring Flotte</h2>
        <span style={{ fontSize: '0.9em', opacity: 0.8 }}>
          Dernière MAJ : {lastUpdate} | Bus actifs : {buses.length}
        </span>
      </header>

      {/* 4. Zone Cartographique */}
      <MapContainer 
        center={[14.72, -17.48]} 
        zoom={13} 
        style={{ flex: 1, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {buses.map((bus) => (
          <Marker 
            key={bus.bus_id} 
            position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]}
            icon={busIcons[bus.ligne_no] || busIcons['default']}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '1.2em', color: '#2c3e50' }}>Ligne {bus.ligne_no}</strong><br />
                <hr />
                Matricule: {bus.bus_id}<br />
                Statut: <span style={{ color: 'green' }}>En circulation</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;