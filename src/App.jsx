import { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import SearchBar from "./SearchBar";


const LAGOS_DEFAULT = [6.5244, 3.3792];
function App() {
  const [userPosition, setUserPosition] = useState(null);
  const [places, setPlaces] = useState([]); 
  const [selectedPlace, setSelectedPlace] = useState(null); 

  // Get user location

useEffect(() => {
  if (!userPosition) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(coords);
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
  }
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
          userPosition={LAGOS_DEFAULT}
          places={places}
          selectedPlace={selectedPlace}
        />
      )}
    </div>
  );
}

export default App;

