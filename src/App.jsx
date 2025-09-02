
import { useState } from "react";
import MapComponent from "./MapComponent";
import SearchBar from "./SearchBar";
function App() {

  const [selectedPlace, setSelectedPlace] = useState(null);

  return(

    <div className="flex h-screen w-screen" >
      <SearchBar setSelectedPlace={setSelectedPlace}/>
      <MapComponent selectedPlace={selectedPlace} />
    </div>
  );
}

export default App;
