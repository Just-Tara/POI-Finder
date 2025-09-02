import React, {useState} from "react"

function SearchBar({ setSelectedPlace}) {

    const [isMenuOpen, setIsMenuopen] = React.useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
      setSearch(e.target.value);

      if (e.target.value.length > 2) {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            e.target.value
          )}.json?access_token=pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ&autocomplete=true&limit=5`
        );
        const data = await res.json();
        setResults(data.features || []);
      } else {
        setResults([]);
      }
    }


    return(
       <div>
         <div className="hidden lg:flex w-[30%] h-full bg-white shadow-lg p-6 flex-col">
            <h1 className="text-xl font-bold mb-4">Search Location</h1> 
            <input 
              type="text"
              onChange={handleSearch} 
              value={search}
              placeholder="Search..."
              className="p-3 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <ul>
              {results.map((place) => {
                <li key={place.id}
                onClick={() => {
                  setSelectedPlace(place);
                  setResults([]);
                  setSearch(place.place_name);
                  }}>
                  {place.place_name}
                </li>
              })}
            </ul>
        </div>

         <button
        onClick={() => setIsMenuopen(true)}
        className="absolute left-3 top-4  z-[1000] p-2 text-3xl lg:hidden"
      >
        ☰
      </button>
        
         {isMenuOpen && (
        <div className="fixed inset-0  z-[1001] flex justify-start lg:hidden ">
          <div className=" w-65 bg-white h-full shadow-lg p-6 md:w-120">
            <button
              onClick={() => setIsMenuopen(false)}
              className="mb-4 p-2 top-5 text-3xl "
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4">Search Location</h2>
            <input
              type="text"
              value={search}
              onChange={handleSearch} 
              placeholder="Search..."
              className="p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <ul>
              {results.map((place) => {
                <li key={place.id}
                className="p-2 hover:bg-gray-200 cursor-pointer"
                onClick={() => {
                  setSelectedPlace(place);
                  setResults([]);
                  setSearch(place.place_name);
                  setIsMenuopen(false);
                  // You can also add logic to update the map position here
                  }}>
                  {place.place_name}
                </li>
              })}
            </ul>
          </div>
        </div>
      )}
       
       </div>
    );
}
export default SearchBar;