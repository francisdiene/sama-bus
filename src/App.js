import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. COMPOSANT ADRESSE ---
function BusAddress({ lat, lon }) {
  const [address, setAddress] = useState("Localisation...");
  useEffect(() => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        const parts = data.display_name.split(',');
        setAddress(parts.length > 2 ? `${parts[0]}, ${parts[1]}` : data.display_name);
      }).catch(() => setAddress("Dakar, Sénégal"));
  }, [lat, lon]);
  return <div style={{ fontSize: '0.85em', color: '#f1c40f', fontWeight: '500' }}>📍 {address}</div>;
}

// --- 2. CONFIGURATION VISUELLE ---
const busIcon = () => new L.Icon({
    iconUrl: `https://img.icons8.com/color/48/bus.png`,
    iconSize: [35, 35], iconAnchor: [17, 35], popupAnchor: [0, -35],
});
const lineColors = { '7': '#3498db', '218': '#2ecc71', '219B': '#f1c40f' };
const terminalPoints = { '7': [14.6687, -17.4344], '218': [14.7480, -17.5200], '219B': [14.7650, -17.4500] };

export default function App() {
  const [step, setStep] = useState('login'); 
  const [credentials, setCredentials] = useState({ username: '', contact: '', password: '', otp: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  // --- LOGIQUE ROUTAGE & AUTH ---
  const fetchRoute = async (line, start, end) => {
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutes(prev => ({ ...prev, [line]: coords }));
      }
    } catch (e) { console.error(e); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost/signup.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("SIMULATION SMS : Votre code est " + data.debug_code);
      setStep('verify');
    } else setMessage({ text: data.message, type: 'error' });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost/verify_code.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: credentials.username, code: credentials.otp })
    });
    const data = await res.json();
    if (data.status === "success") { alert("Compte activé !"); setStep('login'); }
    else setMessage({ text: data.message, type: 'error' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost/login.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (data.status === "success") setStep('dashboard');
    else setMessage({ text: data.message, type: 'error' });
  };

  useEffect(() => {
    if (step === 'dashboard') {
      const fetchBusData = async () => {
        try {
          await fetch('http://localhost/simulateur.php'); 
          const response = await fetch('http://localhost/test.php');
          const data = await response.json();
          setBuses(data);
          setLastUpdate(new Date().toLocaleTimeString());
          data.forEach(bus => {
            if (terminalPoints[bus.ligne_no]) fetchRoute(bus.ligne_no, terminalPoints[bus.ligne_no], [bus.latitude, bus.longitude]);
          });
        } catch (e) { console.error(e); }
      };
      fetchBusData();
      const interval = setInterval(fetchBusData, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // --- RENDU : AUTHENTIFICATION AVEC IMAGE DE FOND ---
  if (step !== 'dashboard') {
    return (
      <div style={{
        ...styles.authPage, 
        // ICI TU METTRAS TON LIEN D'IMAGE DDD
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2069')`
      }}>
        <div style={styles.loginBox}>
          <div style={{fontSize: '3em', marginBottom: '10px'}}>🚌</div>
          <h1 style={{color: '#2c3e50', margin: '0 0 5px 0', fontSize: '2.4em'}}>SamaBus</h1>
          <p style={{color: '#5f6368', marginBottom: '30px'}}>Mobilité Intelligente à Dakar</p>
          
          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Utilisateur" onChange={e => setCredentials({...credentials, username: e.target.value})} style={styles.input} required />
              <input type="password" placeholder="Mot de passe" onChange={e => setCredentials({...credentials, password: e.target.value})} style={styles.input} required />
              <button type="submit" style={styles.btnPrimary}>Se connecter</button>
              <span style={styles.link} onClick={() => setStep('signup')}>Nouveau ? Créer un compte</span>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignup}>
              <input type="text" placeholder="Utilisateur" onChange={e => setCredentials({...credentials, username: e.target.value})} style={styles.input} required />
              <input type="text" placeholder="Email ou Téléphone" onChange={e => setCredentials({...credentials, contact: e.target.value})} style={styles.input} required />
              <input type="password" placeholder="Mot de passe" onChange={e => setCredentials({...credentials, password: e.target.value})} style={styles.input} required />
              <button type="submit" style={styles.btnGreen}>S'inscrire</button>
              <span style={styles.link} onClick={() => setStep('login')}>Déjà inscrit ? Connexion</span>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify}>
              <h3 style={{color:'#e67e22'}}>Vérification OTP</h3>
              <p style={{fontSize:'0.85em', color:'#666'}}>Code envoyé au {credentials.contact}</p>
              <input type="text" placeholder="0000" maxLength="4" onChange={e => setCredentials({...credentials, otp: e.target.value})} style={styles.otpInput} required />
              <button type="submit" style={styles.btnOrange}>Vérifier mon compte</button>
            </form>
          )}
          
          {message.text && (
            <div style={{marginTop: '15px', color: '#e74c3c', fontWeight: 'bold'}}>{message.text}</div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDU : DASHBOARD ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={styles.topBar}>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <span style={styles.logo}>SAMABUS <span style={{fontWeight: '300'}}>LIVE</span></span>
            <div style={styles.statusBadge}>● SYSTÈME OPÉRATIONNEL</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={styles.statsItem}><b>{buses.length}</b> BUS • MAJ: <b>{lastUpdate}</b></div>
            <div style={styles.userInfo}>👤 {credentials.username}</div>
            <button onClick={() => setStep('login')} style={styles.btnLogout}>Quitter</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={styles.sidebar}>
          <h4 style={styles.sidebarTitle}>SUIVI DE LA FLOTTE</h4>
          <div style={{ padding: '0 15px', overflowY: 'auto', flex: 1 }}>
            {buses.map(bus => (
              <div key={bus.bus_id} style={{ ...styles.busCard, borderLeft: `6px solid ${lineColors[bus.ligne_no]}` }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <span style={{fontWeight: 'bold'}}>Ligne {bus.ligne_no}</span>
                    <span style={styles.onlineDot}>LIVE</span>
                </div>
                <BusAddress lat={bus.latitude} lon={bus.longitude} />
                <div style={styles.busMeta}>Vitesse: {Math.floor(Math.random() * 40 + 10)} km/h</div>
              </div>
            ))}
          </div>
          <div style={styles.sidebarFooter}>Dakar 2026 - Control Center</div>
        </div>

        <div style={{ flex: 1 }}>
          <MapContainer center={[14.7167, -17.4677]} zoom={13} style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {Object.keys(routes).map(line => (
              <Polyline key={line} positions={routes[line]} color={lineColors[line]} weight={5} opacity={0.6} />
            ))}
            {buses.map((bus) => (
              <Marker key={bus.bus_id} position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]} icon={busIcon()}>
                <Popup><b>Ligne {bus.ligne_no}</b></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  authPage: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundSize: 'cover', backgroundPosition: 'center' },
  loginBox: { backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center', width: '360px' },
  input: { width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '1em' },
  otpInput: { width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '10px', border: '2px solid #e67e22', textAlign: 'center', fontSize: '1.5em', letterSpacing: '8px' },
  btnPrimary: { width: '100%', padding: '14px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em' },
  btnGreen: { width: '100%', padding: '14px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em' },
  btnOrange: { width: '100%', padding: '14px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em' },
  link: { color: '#3498db', fontSize: '0.9em', marginTop: '20px', cursor: 'pointer', display: 'block', fontWeight: '500' },
  topBar: { height: '65px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 25px', zIndex: 2000 },
  logo: { fontSize: '1.4em', fontWeight: 'bold', color: '#3498db', letterSpacing: '1px' },
  statusBadge: { backgroundColor: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7em', border: '1px solid #2ecc71' },
  statsItem: { fontSize: '0.85em', color: '#bdc3c7' },
  userInfo: { fontSize: '0.9em', borderLeft: '1px solid #34495e', paddingLeft: '20px' },
  sidebar: { width: '380px', backgroundColor: '#2c3e50', display: 'flex', flexDirection: 'column', zIndex: 1000 },
  sidebarTitle: { color: '#95a5a6', fontSize: '0.75em', padding: '20px', margin: 0, letterSpacing: '1px' },
  busCard: { backgroundColor: '#34495e', padding: '15px', marginBottom: '12px', borderRadius: '10px', color: 'white' },
  onlineDot: { backgroundColor: '#2ecc71', color: 'white', fontSize: '0.6em', padding: '2px 6px', borderRadius: '4px' },
  busMeta: { fontSize: '0.7em', color: '#bdc3c7', marginTop: '8px' },
  sidebarFooter: { padding: '15px', textAlign: 'center', fontSize: '0.7em', color: '#7f8c8d' },
  btnLogout: { background: '#e74c3c', color: 'white', border: 'none', padding: '6px 15px', cursor: 'pointer', borderRadius: '5px' }
};