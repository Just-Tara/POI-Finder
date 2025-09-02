import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapComponent({ selectedPlace }) {
      const [position, setPosition] = useState(null); // start as null
  
  
      useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error(err);
    
        setPosition([6.5244, 3.3792]);
      }
    );
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }} className="flex flex-1 h-full">
      {position && (
        <MapContainer 
            center={position} 
            zoom={13} 
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ"
            id="mapbox/streets-v11"
             tileSize={512}
              zoomOffset={-1}
              maxZoom={22}
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://www.mapbox.com/">Mapbox</a>'
          />

          <Marker position={position}>
            <Popup>You are here 🚩</Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}
export default MapComponent;