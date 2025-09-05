import { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import SearchBar from "./SearchBar";

function App() {
  const [userPosition, setUserPosition] = useState(null);
  const [places, setPlaces] = useState([]); 
  const [selectedPlace, setSelectedPlace] = useState(null); 

  // Get user location

  useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      console.log("User location:", pos.coords);
      setUserPosition([pos.coords.latitude, pos.coords.longitude]);
    },
    (err) => {
      console.error("Geolocation error:", err);
      // fallback Lagos
      setUserPosition([6.5244, 3.3792]);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}, []);

  return (
    <div className="flex h-screen w-screen">
      <SearchBar
        userPosition={userPosition}
        setPlaces={setPlaces}
        setSelectedPlace={setSelectedPlace}
      />
      {userPosition && (
        <MapComponent
          userPosition={userPosition}
          places={places}
          selectedPlace={selectedPlace}
        />
      )}
    </div>
  );
}

export default App;

