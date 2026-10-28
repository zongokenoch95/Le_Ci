import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, Loader2, AlertCircle, CheckCircle2, Info, Compass } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDeliveryFee } from '../services/api';

export interface DeliveryLocationData {
  address: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number;
  deliveryFee: number;
  isFree: boolean;
  mode: 'gps' | 'map' | 'manual';
}

interface DeliveryMapPickerProps {
  totalCartAmount: number;
  initialAddress?: string;
  initialLandmark?: string;
  initialDistanceKm?: number;
  initialFee?: number;
  onChange: (data: DeliveryLocationData) => void;
  error?: string;
}

// Coordonnées officielles de l'Atelier Lê Ci à Ouagadougou
const ATELIER_COORDS: [number, number] = [12.3714, -1.5197];

export const DeliveryMapPicker: React.FC<DeliveryMapPickerProps> = ({
  totalCartAmount,
  initialAddress = '',
  initialLandmark = '',
  initialDistanceKm = 3.5,
  initialFee = 1000,
  onChange,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'gps' | 'map'>('gps');
  const [geoLocating, setGeoLocating] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [landmark, setLandmark] = useState(initialLandmark);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(initialDistanceKm);
  const [deliveryFee, setDeliveryFee] = useState<number>(initialFee);
  const [isFree, setIsFree] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Recalcul des frais de livraison via l'API sécurisée du serveur
  const triggerServerCalculation = async (lat: number, lng: number, placeName?: string) => {
    setCalcLoading(true);
    try {
      const res = await calculateDeliveryFee({
        customerLat: lat,
        customerLng: lng,
        totalCartAmount
      });

      if (res && res.success) {
        setDistanceKm(res.distanceKm);
        setDeliveryFee(res.deliveryFee);
        setIsFree(res.isFree);

        const currentAddr = placeName || address || `Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        onChange({
          address: currentAddr,
          landmark,
          lat,
          lng,
          distanceKm: res.distanceKm,
          deliveryFee: res.deliveryFee,
          isFree: res.isFree,
          mode: activeTab
        });
      }
    } catch (err) {
      console.warn('Erreur calcul serveur livraison:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  // Option 1 : Récupération de la position actuelle GPS
  // Notion 28/10/26 : Message d'erreur exact : "Veuillez activer la géolocalisation sur votre appareil"
  const handleGetCurrentLocation = () => {
    setStatusMsg(null);
    if (!navigator.geolocation) {
      setStatusMsg({ type: 'error', text: "Veuillez activer la géolocalisation sur votre appareil" });
      return;
    }

    setGeoLocating(true);

    const onLocationFound = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });

      let locationLabel = `Position GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (geoRes.ok) {
          const data = await geoRes.json();
          if (data && data.display_name) {
            const shortQ = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.display_name.split(',')[0];
            locationLabel = shortQ ? `Quartier ${shortQ}` : data.display_name.split(',').slice(0, 2).join(',');
          }
        }
      } catch (e) {
        // Fallback sans nom
      }

      setAddress(locationLabel);
      setStatusMsg({
        type: 'success',
        text: `Position actuelle détectée avec succès (${Math.round(accuracy)}m de précision) !`
      });

      await triggerServerCalculation(latitude, longitude, locationLabel);
      setGeoLocating(false);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 14);
        updateMapMarkers(latitude, longitude);
      }
    };

    const onLocationError = () => {
      setGeoLocating(false);
      // Règle stricte Notion : "veillez activer la géolocalisation sur votre appareil"
      setStatusMsg({
        type: 'error',
        text: "Veuillez activer la géolocalisation sur votre appareil"
      });
    };

    navigator.geolocation.getCurrentPosition(
      onLocationFound,
      () => {
        // Deuxième essai avec basse précision avant d'afficher l'erreur
        navigator.geolocation.getCurrentPosition(
          onLocationFound,
          onLocationError,
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Mise à jour visuelle des marqueurs sur la carte Leaflet
  const updateMapMarkers = (userLat: number, userLng: number) => {
    if (!mapInstanceRef.current) return;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="background-color: #581C87; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLng]);
    } else {
      const marker = L.marker([userLat, userLng], {
        icon: userIcon,
        draggable: true
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`<strong>Lieu de livraison sélectionné</strong><br/>Déplacez le repère pour ajuster`).openPopup();

      marker.on('dragend', async (e) => {
        const newPos = e.target.getLatLng();
        setCoords({ lat: newPos.lat, lng: newPos.lng });
        await handleMapPositionSelected(newPos.lat, newPos.lng);
      });

      userMarkerRef.current = marker;
    }

    if (polylineRef.current) {
      polylineRef.current.setLatLngs([ATELIER_COORDS, [userLat, userLng]]);
    } else {
      polylineRef.current = L.polyline([ATELIER_COORDS, [userLat, userLng]], {
        color: '#581C87',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.8
      }).addTo(mapInstanceRef.current);
    }
  };

  // Traitement d'un clic sur la carte
  const handleMapPositionSelected = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    updateMapMarkers(lat, lng);

    let locationLabel = `Coordonnées (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const shortQ = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.display_name.split(',')[0];
          locationLabel = shortQ ? `Quartier ${shortQ}` : data.display_name.split(',').slice(0, 2).join(',');
        }
      }
    } catch (e) {}

    setAddress(locationLabel);
    await triggerServerCalculation(lat, lng, locationLabel);
  };

  // Initialisation de Leaflet
  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: coords ? [coords.lat, coords.lng] : ATELIER_COORDS,
        zoom: coords ? 14 : 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const atelierIcon = L.divIcon({
        className: 'custom-atelier-marker',
        html: `
          <div style="background-color: #D4AF37; color: #3B0764; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid white; font-weight: bold;">
            ✦
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });

      L.marker(ATELIER_COORDS, { icon: atelierIcon })
        .addTo(map)
        .bindPopup(`<strong>Atelier Les Douceurs de Lê Ci</strong><br/>Point de départ des livraisons`);

      map.on('click', (e: L.LeafEvent) => {
        const { lat, lng } = (e as L.LeafMouseEvent).latlng;
        handleMapPositionSelected(lat, lng);
      });

      mapInstanceRef.current = map;

      if (coords) {
        updateMapMarkers(coords.lat, coords.lng);
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (activeTab !== 'map' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
        polylineRef.current = null;
      }
    };
  }, [activeTab]);

  const handleLandmarkChange = (val: string) => {
    setLandmark(val);
    onChange({
      address: address || 'Position actuelle',
      landmark: val,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      distanceKm,
      deliveryFee,
      isFree,
      mode: activeTab
    });
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    onChange({
      address: val,
      landmark,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      distanceKm,
      deliveryFee,
      isFree,
      mode: activeTab
    });
  };

  return (
    <div className="space-y-4">
      
      {/* 5. LES DEUX BOUTONS DOIVENT ÊTRE BIEN DISTINCTS (Notion 28/10/26) */}
      {/* "Votre position actuelle" ET "Un autre endroit" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bouton 1 : Votre position actuelle */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('gps');
            if (!address) {
              setAddress('Position GPS actuelle');
            }
          }}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
            activeTab === 'gps'
              ? 'border-[#581C87] bg-purple-50 text-[#581C87] shadow-md ring-2 ring-purple-200'
              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-gray-50/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeTab === 'gps' ? 'bg-[#581C87] text-white shadow-sm' : 'bg-purple-100 text-[#581C87]'
          }`}>
            <Navigation size={20} />
          </div>
          <div className="flex-1">
            <span className="block font-black text-sm">Votre position actuelle</span>
            <span className="block text-[11px] text-gray-500 font-light mt-0.5">
              Détection automatique par GPS
            </span>
          </div>
          {activeTab === 'gps' && (
            <div className="w-5 h-5 rounded-full bg-[#581C87] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} />
            </div>
          )}
        </button>

        {/* Bouton 2 : Un autre endroit */}
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
            activeTab === 'map'
              ? 'border-[#581C87] bg-purple-50 text-[#581C87] shadow-md ring-2 ring-purple-200'
              : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-gray-50/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeTab === 'map' ? 'bg-[#581C87] text-white shadow-sm' : 'bg-purple-100 text-[#581C87]'
          }`}>
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <span className="block font-black text-sm">Un autre endroit</span>
            <span className="block text-[11px] text-gray-500 font-light mt-0.5">
              Choisir un lieu sur la carte
            </span>
          </div>
          {activeTab === 'map' && (
            <div className="w-5 h-5 rounded-full bg-[#581C87] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} />
            </div>
          )}
        </button>
      </div>

      {/* CONTENU OPTION 1 : VOTRE POSITION ACTUELLE */}
      {/* Notion : Masquer les champs quartier et la liste des quartiers. Garder champ point de repère. */}
      {activeTab === 'gps' && (
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-600">
              <span className="font-bold text-gray-900 block mb-0.5">Localisation en 1 clic :</span>
              <span>Cliquez sur le bouton pour récupérer instantanément vos coordonnées GPS.</span>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={geoLocating}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white text-xs font-black shadow-md shadow-purple-900/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {geoLocating ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Localisation en cours...</span>
                </>
              ) : (
                <>
                  <Navigation size={15} />
                  <span>Activer ma position actuelle</span>
                </>
              )}
            </button>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
              <span className="font-medium">{statusMsg.text}</span>
            </div>
          )}

          {/* Point de repère conservé (Obligatoire) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Info size={13} className="text-[#581C87]" />
              Point de repère précis (Ex : en face de la pharmacie, portail blanc...) *
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => handleLandmarkChange(e.target.value)}
              placeholder="Ex : En face de la pharmacie, villa blanche portail marron..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-xs sm:text-sm bg-white"
            />
          </div>
        </div>
      )}

      {/* CONTENU OPTION 2 : UN AUTRE ENDROIT (CARTE INTERACTIVE) */}
      {activeTab === 'map' && (
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <Compass size={15} className="text-[#581C87]" />
              Cliquez sur la carte ou déplacez le repère :
            </span>
            <span className="text-[11px] text-[#581C87] font-semibold">
              ✦ Atelier Lê Ci marqué en doré
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-64 sm:h-80 rounded-2xl border border-purple-200 overflow-hidden relative shadow-inner z-0"
          />

          <p className="text-[11px] text-gray-500 font-light italic">
            Astuce : cliquez sur le lieu où vous souhaitez être livré pour positionner le repère de livraison.
          </p>

          {/* Champs d'adresse et de repère */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#581C87]" />
                Quartier / Adresse du lieu *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Ex : Ouaga 2000, Koulouba, Zone du Bois..."
                className={`w-full px-3.5 py-3 rounded-2xl outline-none text-xs sm:text-sm bg-white transition ${
                  error ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Info size={13} className="text-[#581C87]" />
                Point de repère précis *
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => handleLandmarkChange(e.target.value)}
                placeholder="Ex : En face de la pharmacie, portail noir..."
                className="w-full px-3.5 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

          {/* Chips des quartiers (uniquement affichés en mode Un autre endroit) */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
              ✦ Ou sélectionnez directement votre quartier :
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Ouaga 2000', km: 4.8 },
                { name: 'Zone du Bois', km: 2.5 },
                { name: 'Koulouba', km: 1.8 },
                { name: 'Dassasgho', km: 3.2 },
                { name: 'Somgandé', km: 5.0 },
                { name: 'Patte d\'Oie', km: 4.0 },
                { name: 'Gounghin', km: 3.5 },
                { name: 'Pissy', km: 6.2 },
                { name: 'Karpala', km: 7.0 },
                { name: 'Tampouy', km: 7.5 }
              ].map((q) => (
                <button
                  type="button"
                  key={q.name}
                  onClick={() => {
                    setAddress(q.name);
                    setDistanceKm(q.km);
                    const calculated = q.km <= 3.5 ? 1000 : Math.round(((q.km / 3.5) * 1000) / 100) * 100;
                    setDeliveryFee(calculated);
                    onChange({
                      address: q.name,
                      landmark,
                      lat: null,
                      lng: null,
                      distanceKm: q.km,
                      deliveryFee: calculated,
                      isFree: false,
                      mode: 'manual'
                    });
                  }}
                  className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-[#581C87] text-[11px] font-semibold border border-purple-200/80 transition cursor-pointer"
                >
                  + {q.name} ({q.km} km)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 animate-pulse">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* 3. FRAIS DE LIVRAISON : ÉCRIRE SIMPLEMENT (Notion 28/10/26) */}
      {/* "Pour les frais de livraison Écrire simplement : Frais de livraison : montant" */}
      <div className="p-4 px-5 rounded-2xl bg-[#581C87] text-white shadow-md flex items-center justify-between">
        <span className="text-sm font-extrabold tracking-wide">
          Frais de livraison :
        </span>
        <div className="flex items-center gap-2">
          {calcLoading && <Loader2 size={14} className="animate-spin text-purple-200" />}
          <span className="text-lg sm:text-xl font-black text-amber-300">
            {isFree ? '0 FCFA (Offerte)' : `${deliveryFee.toLocaleString('fr-FR')} FCFA`}
          </span>
        </div>
      </div>

    </div>
  );
};
