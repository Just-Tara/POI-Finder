import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {useState, useEffect } from "react";
import L from "leaflet";



function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const R = 6371; // Earth radius in km
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
// helper function

const searchIcon = (color = "darkorange") =>
  L.divIcon({
    className: "",
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <!-- Pin shape -->
        <path d="M15 0C9 0 4 6 4 13c0 10 11 27 11 27s11-17 11-27c0-7-5-13-11-13z" 
              fill="${color}" />
        <!-- Inner circle to differentiate from user marker -->
        <circle cx="15" cy="13" r="5" fill="white" />
      </svg>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -35],
  });


// usage when mapping markers



function FlyToPlace({ place }) {
  const map = useMap();
  useEffect(() => {
    if (place?.center) {
      map.flyTo([place.center[1], place.center[0]], 13, { duration: 1.5 });
    }
  }, [place, map]);
  return null;
}

function MapComponent({ userPosition, places, selectedPlace }) {
  return (
    <div className="flex-1 relative">
      <MapContainer
        center={userPosition}
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
        <Marker position={userPosition}>
          <Popup>Your Location </Popup>
        </Marker>

        {/* All search markers */}
        
          {places.map(
                    (place) =>
                      place.center && (
                        <Marker
                          key={place.id}
                          icon={searchIcon(place.markerColor || "darkorange")}
                          position={[place.center[1], place.center[0]]}
                        >
                          <Popup>
                            <h2 className="font-bold">{place.text || "Unnamed Place"}</h2>
                            <p className="text-sm">{place.place_name}</p>
                          </Popup>
                        </Marker>
                      )
                  )}
        {/* Fly to selected */} 
        {selectedPlace && <FlyToPlace place={selectedPlace} />}

        {/* Line and selected marker */}  
         {userPosition && selectedPlace?.center && (
          <>
            <Polyline
              positions={[
                userPosition,
                [selectedPlace.center[1], selectedPlace.center[0]],
              ]}
              color="#0096FF"
            />
            <Marker
              icon={searchIcon("darkorange")}
              position={[selectedPlace.center[1], selectedPlace.center[0]]}
            >
              <Popup>
                <strong>{selectedPlace.text || "Selected Place"}</strong>
                <br />
                {selectedPlace.place_name}
                <br />
                Distance:{" "}
                {haversineDistance(
                  userPosition,
                  [selectedPlace.center[1], selectedPlace.center[0]]
                ).toFixed(2)}{" "}
                km
              </Popup>
            </Marker>
          </>
        )}
       
      </MapContainer>
    </div>
  );
}

export default MapComponent;
