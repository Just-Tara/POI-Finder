// src/components/MapComponent.js
import React, { useState, useEffect } from "react"; // Import useState
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


function haversineDistance([lat1, lon1], [lat2, lon2]) {
 const R = 6371; // Earth radius in km
 const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
 const a =
 Math.sin(dLat / 2) ** 2 +
 Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
 Math.sin(dLon / 2) ** 2;  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const searchIcon = (color = "darkorange") =>
   L.divIcon({
   className: "",
   html: `
   <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
     <path d="M15 0C9 0 4 6 4 13c0 10 11 27 11 27s11-17 11-27c0-7-5-13-11-13z" 
     fill="${color}" />
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
 if (place?.center) {
 map.flyTo([place.center[1], place.center[0]], 13, { duration: 1.5 });
}
 }, [place, map]);
 return null;
}

const MAPBOX_TOKEN = "pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ"; 

function MapComponent({ userPosition, places, selectedPlace }) {
  const [route, setRoute] = useState(null); 


 useEffect(() => {
  if (!userPosition || !selectedPlace?.center) {
    setRoute(null);
    return;
  }

  const fetchRoute = async () => {
    const origin = `${userPosition[1]},${userPosition[0]}`;
    const destination = `${selectedPlace.center[0]},${selectedPlace.center[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      setRoute(data.routes[0].geometry.coordinates);
    } else {
      setRoute(null);
    }
  };

  fetchRoute();
}, [userPosition, selectedPlace]);

  return (
    <div className="flex-1 relative">
      <MapContainer
        // Ensure center is provided if userPosition might be null initially
        center={userPosition || [51.505, -0.09]} 
        zoom={13}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ&autocomplete=true&limit=5"
          tileSize={512}
          zoomOffset={-1}
          attribution='© <a href="https://www.openstreetmap.org/">OSM</a> contributors © <a href="https://www.mapbox.com/">Mapbox</a>'
        />

        {/* User location */}
        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* All search markers */}
        {places.map(
          (place) =>
            place.center && (
              <Marker
                key={place.id}
                icon={searchIcon("darkorange")}

                position={[place.center[1], place.center[0]]} // React Leaflet expects [lat, lon]
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
                        {[place.tags["addr:housename"], place.tags["addr:housenumber"], place.tags["addr:street"], place.tags["addr:postcode"]]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {userPosition && (
                      <p>
                        <strong>Distance:</strong>{" "}
                        {haversineDistance(userPosition, [place.center[1], place.center[0]]).toFixed(2)} km
                      </p>
                    )}
                  </div>
                </Popup>

              </Marker>
            )
        )}

        {/* Fly to selected */}
        {selectedPlace && <FlyToPlace place={selectedPlace} />}

        {/* Driving Route Polyline */}
       {route && (
          <Polyline
            positions={route.map(coord => [coord[1], coord[0]])} // [lat, lon] for Leaflet
            color="#0096FF"
            weight={5}
          />
        )}

      </MapContainer>
    </div>
  );
}

export default MapComponent;