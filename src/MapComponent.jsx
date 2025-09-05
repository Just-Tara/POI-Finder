// src/components/MapComponent.js
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Helper to correctly map coordinates for Leaflet
const getLeafletPosition = (place) => {
  if (!place.center) return null;
  return place.source === "mapbox"
    ? [place.center[1], place.center[0]]
    : [place.center[0], place.center[1]]; // Overpass: keep as is
};
// Returns [lon, lat] for Mapbox Directions
const getMapboxCoords = (place) => {
  if (!place.center) return null;
  return place.source === "mapbox"
    ? place.center // Mapbox already [lon, lat]
    : [place.center[1], place.center[0]]; // swap for Overpass [lat, lon] -> [lon, lat]
};


const searchIcon = (color = "darkorange") =>
  L.divIcon({
    className: "",
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C9 0 4 6 4 13c0 10 11 27 11 27s11-17 11-27c0-7-5-13-11-13z" fill="${color}" />
        <circle cx="15" cy="13" r="5" fill="white" />
      </svg>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -35],
  });

function FlyToPlace({ place }) {
  const map = useMap();
  useEffect(() => {
    const pos = getLeafletPosition(place);
    if (pos) map.flyTo(pos, 13, { duration: 1.5 });
  }, [place, map]);
  return null;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ";

function MapComponent({ userPosition, places, selectedPlace }) {
  const [route, setRoute] = useState(null);


  const fetchRouteToPlace = async (place) => {
  if (!userPosition || !place.center) return;

  const origin = `${userPosition[1]},${userPosition[0]}`; // [lon, lat]
  const [destLon, destLat] = getMapboxCoords(place);
  const destination = `${destLon},${destLat}`;

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      setRoute(data.routes[0].geometry.coordinates);
    } else {
      setRoute(null);
    }
  } catch (err) {
    console.error("Error fetching route:", err);
    setRoute(null);
  }
};


return (
    <div className="flex-1 relative">
      <MapContainer
        center={userPosition || [51.505, -0.09]}
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
          tileSize={512}
          zoomOffset={-1}
          attribution='© <a href="https://www.openstreetmap.org/">OSM</a> contributors © <a href="https://www.mapbox.com/">Mapbox</a>'
        />

        {/* User Location */}
        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Search Results */}
        {places.map(
          (place) =>
            getLeafletPosition(place) && (
              <Marker
                key={place.id}
                icon={searchIcon(place.markerColor || "darkorange")}
                position={getLeafletPosition(place)}
              >
                <Popup>
                  <div className="max-w-xs">
                    <h2 className="font-bold text-lg mb-1">{place.tags?.name || place.place_name}</h2>
                    {place.tags?.amenity && <p><strong>Type:</strong> {place.tags.amenity}</p>}
                    {place.tags?.shop && <p><strong>Type:</strong> {place.tags.shop}</p>}
                    {place.tags?.capacity && <p><strong>Capacity:</strong> {place.tags.capacity}</p>}
                    {place.tags?.opening_hours && <p><strong>Opening Hours:</strong> {place.tags.opening_hours}</p>}
                    {place.tags?.smoking && <p><strong>Smoking:</strong> {place.tags.smoking}</p>}
                    {place.tags?.takeaway && <p><strong>Takeaway:</strong> {place.tags.takeaway}</p>}
                    {(place.tags?.["addr:street"] || place.tags?.["addr:housenumber"] || place.tags?.["addr:postcode"]) && (
                      <p>
                        <strong>Address:</strong>{" "}
                        {[place.tags["addr:housename"], 
                            place.tags["addr:housenumber"], 
                            place.tags["addr:street"], 
                            place.tags["addr:postcode"]]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {userPosition && (
                      <p>
                        <strong>Distance:</strong> 
                        {haversineDistance(userPosition, getLeafletPosition(place)).toFixed(2)} km
                      </p>
                    )}
                    <button
                      className="mt-2 px-3.5 py-2 bg-blue-500 text-white rounded cursor-pointer"
                      onClick={() => fetchRouteToPlace(place)}
                    >
                      Show Driving Route
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
        )}

        {/* Fly to selected */}
        {selectedPlace && <FlyToPlace place={selectedPlace} />}

        {/* Driving Route */}
        {route && (
          <Polyline
            positions={route.map((coord) => [coord[1], coord[0]])}
            color="#0096FF"
            weight={5}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
