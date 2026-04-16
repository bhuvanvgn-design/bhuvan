import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Navigation, ArrowLeft, Loader2, Shield, Hospital, Pill, Map as MapIcon, List, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Place {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
}

interface NearbyPlacesViewProps {
  type: 'police' | 'hospital' | 'pharmacy';
  onClose: () => void;
  t: (key: string) => string;
}

export function NearbyPlacesView({ type, onClose, t }: NearbyPlacesViewProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyPlaces = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      // Overpass API tags for different types
      const tags: Record<string, string> = {
        police: 'amenity=police',
        hospital: 'amenity=hospital',
        pharmacy: 'amenity=pharmacy'
      };

      const query = `[out:json];node(around:10000,${lat},${lon})[${tags[type]}];out;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      const results: Place[] = data.elements.map((el: any) => ({
        id: el.id,
        name: el.tags.name || t(`Unnamed ${type}`),
        lat: el.lat,
        lon: el.lon,
        distance: calculateDistance(lat, lon, el.lat, el.lon),
        address: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : undefined,
        phone: el.tags.phone || el.tags['contact:phone']
      })).sort((a: Place, b: Place) => a.distance - b.distance);

      setPlaces(results);
    } catch (err) {
      console.error(err);
      setError(t("Failed to find nearby places. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lon: longitude });
        fetchNearbyPlaces(latitude, longitude);
      },
      (err) => {
        setError(t("Location permission denied or unavailable."));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [type]);

  const getIcon = () => {
    switch (type) {
      case 'police': return <Shield className="text-blue-500" size={24} />;
      case 'hospital': return <Hospital className="text-red-500" size={24} />;
      case 'pharmacy': return <Pill className="text-green-500" size={24} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'police': return t("Police Stations Near Me");
      case 'hospital': return t("Hospitals Near Me");
      case 'pharmacy': return t("Pharmacies Near Me");
    }
  };

  function RecenterMap({ coords }: { coords: { lat: number; lon: number } }) {
    const map = useMap();
    useEffect(() => {
      map.setView([coords.lat, coords.lon], 14);
    }, [coords, map]);
    return null;
  }

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${type}+near+me`, '_blank');
  };

  const navigateToNearest = () => {
    if (places.length > 0) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${places[0].lat},${places[0].lon}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-[#f4f4f2] z-[100] flex flex-col overflow-hidden"
    >
      {/* Background Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-white/40 backdrop-blur-xl border-b border-white/50 z-10">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-white/80"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-white/50">
              {getIcon()}
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">{getTitle()}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openInGoogleMaps}
            className="p-2 bg-white rounded-xl text-gray-500 border border-white/80 shadow-sm"
            title={t("Open in Google Maps")}
          >
            <ExternalLink size={20} />
          </motion.button>
          <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-white/80 shadow-sm">
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'map' ? 'bg-black text-white shadow-lg' : 'text-gray-400'}`}
            >
              <MapIcon size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-gray-400'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <Loader2 size={40} className="animate-spin" />
            <p className="font-black uppercase text-[10px] tracking-widest">{t("Searching nearby...")}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <MapPin size={32} />
            </div>
            <p className="text-gray-900 font-bold">{error}</p>
            <button
              onClick={() => userCoords && fetchNearbyPlaces(userCoords.lat, userCoords.lon)}
              className="bg-black text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl"
            >
              {t("Try Again")}
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                {userCoords && (
                  <MapContainer
                    center={[userCoords.lat, userCoords.lon]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <RecenterMap coords={userCoords} />
                    <Marker position={[userCoords.lat, userCoords.lon]}>
                      <Popup>{t("You are here")}</Popup>
                    </Marker>
                    {places.map((place) => (
                      <Marker key={place.id} position={[place.lat, place.lon]}>
                        <Popup>
                          <div className="p-1">
                            <h4 className="font-bold text-gray-900 mb-1">{place.name}</h4>
                            <p className="text-[10px] text-gray-500 mb-2">{place.distance.toFixed(2)} km {t("away")}</p>
                            <button
                              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`, '_blank')}
                              className="w-full bg-black text-white py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            >
                              {t("Directions")}
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto p-6 space-y-4"
              >
                {places.length > 0 && (
                  <div className="mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={navigateToNearest}
                      className="w-full bg-primary text-white py-5 rounded-[2rem] flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-pink-200"
                    >
                      <Navigation size={20} />
                      {t("Navigate to Nearest")}
                    </motion.button>
                  </div>
                )}
                {places.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <MapPin size={32} />
                    </div>
                    <p className="text-gray-500 font-bold">{t("No results found in your area.")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {places.map((place, i) => (
                      <motion.div
                        key={place.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white/70 backdrop-blur-md p-5 rounded-[2.5rem] border border-white/80 shadow-sm hover:shadow-xl transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{place.name}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                              <MapPin size={12} />
                              <span>{place.distance.toFixed(2)} km {t("away")}</span>
                            </div>
                            {place.address && (
                              <p className="text-xs text-gray-400 mt-2 font-medium">{place.address}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`, '_blank')}
                            className="flex-1 bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg"
                          >
                            <Navigation size={16} />
                            {t("Directions")}
                          </motion.button>
                          {place.phone && (
                            <motion.a
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              href={`tel:${place.phone}`}
                              className="w-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-900 shadow-sm"
                            >
                              <Phone size={20} />
                            </motion.a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
