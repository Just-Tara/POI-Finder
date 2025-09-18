import { useState, useEffect } from "react";
import MapComponent from "./MapComponent";
import SearchBar from "./SearchBar";

function App() {
  const [userPosition, setUserPosition] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
     
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(coords);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setUserPosition(null); 
      }
    );
  }, []);

  return (
    <div className="flex h-screen w-screen">
      
      <SearchBar
        userPosition={userPosition}
        setPlaces={setPlaces}
        setSelectedPlace={setSelectedPlace}
      />
  
      
      {userPosition ? (
        <MapComponent
          userPosition={userPosition}
          places={places}
          selectedPlace={selectedPlace}
        />  
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Getting your location...</p>
        </div>
      )}
 
    </div>
  );
}

export default App;
