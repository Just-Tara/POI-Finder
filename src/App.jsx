import { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import SearchBar from "./SearchBar";

function App() {
  const [userPosition, setUserPosition] = useState(null);
  const [places, setPlaces] = useState([]); // all search results
  const [selectedPlace, setSelectedPlace] = useState(null); // clicked marker

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPosition([6.5244, 3.3792]) // fallback to Lagos
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
