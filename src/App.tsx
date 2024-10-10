import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Plane, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface Aircraft {
  icao24: string;
  callsign?: string;
  longitude: number;
  latitude: number;
  velocity?: number;
  true_track?: number;
  vertical_rate?: number;
  on_ground: boolean;
}

const planeIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const sampleAircraft: Aircraft[] = [
  {
    icao24: 'a1b2c3',
    callsign: 'SAMPLE1',
    longitude: -0.1276,
    latitude: 51.5074,
    velocity: 200,
    true_track: 90,
    vertical_rate: 0,
    on_ground: false,
  },
  // ... (keep other sample aircraft)
];

function App() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAircraftData = async () => {
    try {
      const response = await fetch('https://opensky-network.org/api/states/all');
      if (!response.ok) {
        throw new Error('Failed to fetch data from OpenSky Network');
      }
      const data = await response.json();
      const aircraftData: Aircraft[] = data.states.map((state: any) => ({
        icao24: state[0],
        callsign: state[1]?.trim() || 'N/A',
        longitude: state[5],
        latitude: state[6],
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        on_ground: state[8],
      }));
      setAircraft(aircraftData);
      setError(null);
    } catch (err) {
      console.error('Error fetching ADS-B data:', err);
      setError('Failed to fetch live data. Displaying sample data.');
      setAircraft(sampleAircraft);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAircraftData();
    const interval = setInterval(fetchAircraftData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Plane className="mr-2" /> ADS-B Traffic Map
        </h1>
      </header>
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex items-center">
          <AlertTriangle className="mr-2" />
          <p>{error}</p>
        </div>
      )}
      <main className="flex-grow relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <MapContainer center={[20, 0]} zoom={3} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {aircraft.map((plane) => (
              <Marker
                key={plane.icao24}
                position={[plane.latitude, plane.longitude]}
                icon={planeIcon}
              >
                <Popup>
                  <div>
                    <h2 className="font-bold">{plane.callsign}</h2>
                    <p>ICAO24: {plane.icao24}</p>
                    <p>Speed: {plane.velocity ? `${Math.round(plane.velocity * 3.6)} km/h` : 'N/A'}</p>
                    <p>Altitude: {plane.on_ground ? 'On ground' : (plane.vertical_rate ? `${Math.round(plane.vertical_rate)} m/s` : 'N/A')}</p>
                    <p>Heading: {plane.true_track ? `${Math.round(plane.true_track)}°` : 'N/A'}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </main>
    </div>
  );
}

export default App;