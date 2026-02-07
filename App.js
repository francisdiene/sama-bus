import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Correction icône Leaflet par défaut
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Coordonnées de test : Trajet sur la VDN (Dakar)
const BUS_PATH = [
    [14.7483, -17.4594], // Point A
    [14.7400, -17.4550], // Point B
    [14.7300, -17.4500], // Point C
    [14.7200, -17.4450]  // Point D
];

const BusMap = () => {
    const [busPos, setBusPos] = useState(BUS_PATH[0]);
    const [step, setStep] = useState(0);

    // Simulation du mouvement du bus
    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prevStep) => {
                const nextStep = (prevStep + 1) % BUS_PATH.length;
                setBusPos(BUS_PATH[nextStep]);
                return nextStep;
            });
        }, 3000); // Le bus bouge toutes les 3 secondes

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <h2 style={{ textAlign: 'center', padding: '10px' }}>Sama Bus - Ligne 121 (Live)</h2>
            <MapContainer center={[14.7167, -17.4677]} zoom={13} style={{ height: "90%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                <Marker position={busPos}>
                    <Popup>
                        🚌 <b>Bus DDD - Ligne 121</b> <br /> 
                        Statut: En mouvement <br />
                        Prochain arrêt: Liberté 6
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default BusMap;