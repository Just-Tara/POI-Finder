import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function SearchBar({ userPosition, setPlaces, setSelectedPlace }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchHistorys, setSearchHistorys] = useState([]);

  // Add to history
  function addSearch() {
    if (search.trim() !== "") {
      setSearchHistorys((s) => [...s, search]);
    }
  }

  // Delete from history
  function deleteSearch(index) {
    setSearchHistorys((s) => s.filter((_, i) => i !== index));
  }

  // Mapping for Overpass queries
  const poiMap = {
    restaurant: '["amenity"="restaurant"]',
    food: '["amenity"~"restaurant|fast_food|food_court"]',
    cafe: '["amenity"="cafe"]',
    hotel: '["tourism"="hotel"]',
    hospital: '["amenity"="hospital"]',
    bank: '["amenity"="bank"]',
    school: '["amenity"="school"]',
    mall: '["shop"="mall"]',
  };

  // Handle typing input
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!userPosition || value.length < 2) {
      setResults([]);
      return;
    }

    const [lat, lng] = userPosition;
    const keyword = Object.keys(poiMap).find((k) =>
      value.toLowerCase().includes(k)
    );

    if (keyword) {
      // 🔎 Use Overpass API
      const filter = poiMap[keyword];
      const query = `
        [out:json];
        node${filter}(around:3000,${lat},${lng});
        out;
      `;

      try {
        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query,
        });
        const data = await res.json();

        const places = data.elements.map((el) => ({
          id: el.id,
          place_name: el.tags.name || `Unnamed ${keyword}`,
          center: [el.lat, el.lon],
          markerColor: "darkorange",
        }));

        setResults(places);
      } catch (err) {
        console.error("Overpass error:", err);
        setResults([]);
      }
    } else {
      // 🔎 Default Mapbox search
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            value
          )}.json?access_token=pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ&autocomplete=true&limit=5&proximity=${lng},${lat}`
        );
        const data = await res.json();

        const features =
          data.features?.map((f) => ({
            ...f,
            markerColor: "darkorange",
          })) || [];

        setResults(features);
      } catch (err) {
        console.error("Mapbox error:", err);
        setResults([]);
      }
    }
  };

  //  Handle clicking a dropdown place
  const handleSelectPlace = (place) => {
    const placeWithColor = { ...place, markerColor: "darkorange" };
    setSelectedPlace(placeWithColor);
    setPlaces([placeWithColor]);
    setSearch(place.place_name);
    setResults([]);
    setIsMenuOpen(false);
  };

  //Handle pressing search button
  const handleSearchSubmit = async () => {
    if (!search || !userPosition) return;

    const [lat, lng] = userPosition; // keep consistent
    const proximity = `${lng},${lat}`;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          search
        )}.json?access_token=pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ&autocomplete=true&limit=5&proximity=${proximity}`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const updated = data.features.map((f) => ({
          ...f,
          markerColor: "darkorange",
        }));

        setPlaces(updated);
        setSelectedPlace(updated[0]);
        setResults([]);
        addSearch();
      }
    } catch (err) {
      console.error("Mapbox submit error:", err);
    }
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block w-[22%] bg-white p-6 shadow-lg">
        <h1 className="text-xl font-bold mb-4">Search Location</h1>
        <div className="flex">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search"
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearchSubmit}
            className="w-16 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex justify-center items-center"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>

        {/* Results Dropdown */}
        <ul>
          {results.map((place) => (
            <li
              key={place.id}
              onClick={() => handleSelectPlace(place)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {place.place_name}
            </li>
          ))}
        </ul>

        {/* Search History */}
        <h4 className="text-gray-4 00 text-center w-[90%] mt-6">Search History</h4>
        {searchHistorys.length === 0 ? (
          <p className="text-center text-gray-300 w-[90%]">No search history</p>
        ) : (
          <ul>
            {searchHistorys.map((searchHistory, index) => (
              <li
                key={index}
                className="mt-2 flex justify-between w-[80%] m-auto"
              >
                <span>{searchHistory}</span>
                <button
                  onClick={() => deleteSearch(index)}
                  className="cursor-pointer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mobile view */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="absolute left-3 top-4 z-[1000] p-2 text-3xl lg:hidden"
      >
        ☰
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-start lg:hidden">
          <div className="bg-white h-full shadow-lg p-6 md:w-120">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="left-3 relative p-2 top-5 text-3xl"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">Search Location</h2>
           <div className="flex"> 
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search"
                className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSearchSubmit}
                className="w-16 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex justify-center items-center"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchBar;
