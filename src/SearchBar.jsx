import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";


function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// The main SearchBar component
export default function SearchBar({ userPosition, setPlaces, setSelectedPlace }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState("info"); 

  // --- POI Categories and Keywords ---
  const poiCategories = {
    food: {
      label: "Food",
      queries: [
        { name: "Restaurants", key: "amenity", value: "restaurant" },
        { name: "Fast Food", key: "amenity", value: "fast_food" },
        { name: "Cafes", key: "amenity", value: "cafe" },
        { name: "Bakeries", key: "shop", value: "bakery" },
        { name: "Food Trucks", key: "amenity", value: "street_food" },
      ],
      color: "darkorange",

    },
    shopping: {
      label: "Shopping",
      queries: [
        { name: "Malls", key: "shop", value: "mall" },
        { name: "Supermarkets", key: "shop", value: "supermarket" },
        { name: "Pharmacies", key: "shop", value: "pharmacy" },
      ],
      color: "darkorange",
    },
    services: {
      label: "Services",
      queries: [
        { name: "Hospitals", key: "amenity", value: "hospital" },
        { name: "Banks", key: "amenity", value: "bank" },
        { name: "Post Offices", key: "amenity", value: "post_office" },
      ],
      color: "darkorange",
    },
    education: {
      label: "Education",
      queries: [
        { name: "Schools", key: "amenity", value: "school" },
        { name: "Universities", key: "amenity", value: "university" },
      ],
      color: "darkorange",
    },
    tourism: {
      label: "Tourism",
      queries: [
        { name: "Hotels", key: "tourism", value: "hotel" },
        { name: "Museums", key: "tourism", value: "museum" },
        { name: "Parks", key: "leisure", value: "park" },
      ],
      color: "darkorange",
    },
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  function addSearchToHistory(term) {
    if (term.trim() !== "" && !searchHistory.includes(term)) {
      setSearchHistory((prevHistory) => [...prevHistory, term].slice(-10));
    }
  }

  function deleteSearchFromHistory(index) {
    setSearchHistory((prevHistory) => prevHistory.filter((_, i) => i !== index));
  }

  // --- Search Logic ---

const performOverpassSearch = async (filter, categoryName, keyword) => {
  if (!userPosition) {
    console.warn("No user position available");
    return [];
  }

  if (!filter || !filter.key || !filter.value) {
    console.error("Missing key/value in filter:", filter, categoryName, keyword);
    return [];
  }

  const { key, value } = filter;
  const [lat, lng] = userPosition;

  let radius = 8000; 
  const maxRadius = 20000; 
  const step = 2000; 
  let results = [];

  while (radius <= maxRadius && results.length === 0) {
    const query = `
      [out:json];
      (
        node["${key}"="${value}"](around:${radius},${lat},${lng});
        way["${key}"="${value}"](around:${radius},${lat},${lng});
        relation["${key}"="${value}"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const text = await res.text();
      const data = JSON.parse(text);

      results = data.elements
        .map((el) => ({
          id: el.id,
          place_name: el.tags?.name || `Unnamed ${keyword || categoryName}`,
          center:
            el.type === "node"
              ? [el.lat, el.lon]
              : el.center
              ? [el.center.lat, el.center.lon]
              : null,
          markerColor: poiCategories[categoryName]?.color || "darkorange",
          tags: el.tags,
          source: "overpass",
        }))
        .filter((place) => place.center);
    } catch (err) {
      console.error(`Overpass API error for ${keyword || categoryName}:`, err);
      return [];
    }

    if (results.length === 0) radius += step; // increase radius and try again
  }

  return results;
};



  const performMapboxSearch = async (queryText) => {
    if (!userPosition) return [];

    const [lat, lng] = userPosition;
    const proximity = `${lng},${lat}`;

  
    const mapboxToken = "pk.eyJ1IjoianVzdC10YXJhMjIiLCJhIjoiY21mMGUxZ2toMDBtZzJrc2FlNWRzcDl6aCJ9.oyosw0Zns7GNkLYPiKESSQ";

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          queryText
        )}.json?access_token=${mapboxToken}&limit=5&proximity=${proximity}`
      );
      const data = await res.json();

      const features =
        data.features?.map((f) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center, 
          text: f.text,
          properties: f.properties,
          markerColor: "darkorange",
          source: "mapbox", 
        })) || [];
      return features;
    } catch (err) {
      console.error("Mapbox Geocoding API error:", err);
      return [];
    }
  };

  const debouncedHandleSearch = debounce(async (value) => {
    if (!userPosition || value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let foundPlaces = [];

    
    for (const categoryKey in poiCategories) {
      for (const poi of poiCategories[categoryKey].queries) {
        if (value.toLowerCase().includes(poi.name.toLowerCase())) {
          foundPlaces = await performOverpassSearch(poi, categoryKey, poi.name);
          break;
        }
      }
      if (foundPlaces.length > 0) break;
    }

    
    if (foundPlaces.length === 0) {
      foundPlaces = await performMapboxSearch(value);
    }
    
    setSearchResults(foundPlaces);
  }, 300);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setMessage(""); 
    debouncedHandleSearch(value);
  };


  const handleSelectPlace = (place) => {
    let leafletPosition = place.center;

 
    if (place.source === "mapbox" && place.center) {
      leafletPosition = [place.center[1], place.center[0]];
    }

    setSelectedPlace({
      ...place,
      center: leafletPosition,
      markerColor: place.markerColor || "blue",
    });
    setPlaces([{ ...place, center: leafletPosition }]);
    setSearchResults([]);
  };

  // Handles submitting the search query
  const handleSearchSubmit = async () => {
    if (!searchQuery || !userPosition) {
      setMessage("Please enter a search query or wait for your location to be determined.");
      setMessageType("error");
      return;
    }
    
    let foundPlaces = [];

    //  POI search first
    for (const categoryKey in poiCategories) {
      for (const poi of poiCategories[categoryKey].queries) {
        if (searchQuery.toLowerCase().includes(poi.name.toLowerCase())) {
          foundPlaces = await performOverpassSearch(poi, categoryKey, poi.name);
          break;
        }
      }
      if (foundPlaces.length > 0) break;
    }

    // If no POI found, fallback to Mapbox
    if (foundPlaces.length === 0) {
      foundPlaces = await performMapboxSearch(searchQuery);
    }

    if (foundPlaces.length > 0) {
      const placesWithCorrectedCoords = foundPlaces.map((p) => {
        let leafletPosition = p.center;
        if (p.source === "mapbox" && p.center) {
          leafletPosition = [p.center[1], p.center[0]];
        }
        return { ...p, center: leafletPosition };
      });
      
      setPlaces(placesWithCorrectedCoords);
      setSelectedPlace(placesWithCorrectedCoords[0]);
      setSearchResults([]);
      addSearchToHistory(searchQuery);
    }else {
      setMessage("No results found for your search.");
      setMessageType("error");
      setPlaces([]);
      setSelectedPlace(null);
    }
  };

  // Handles search button clicks
  const handleQuickSearch = async (keyword) => {
    let categoryKey = null;
    let poi = null;

    for (const catKey in poiCategories) {
      for (const p of poiCategories[catKey].queries) {
        if (p.name.toLowerCase() === keyword.toLowerCase()) {
          categoryKey = catKey;
          poi = p;
          break;
        }
      }
      if (poi) break;
    }

    if (!poi || !categoryKey) {
      console.error("POI definition not found for:", keyword);
      return;
    }
    
    setMessage("");
    setMessage("Searching...")
    setMessageType("success");
    const places = await performOverpassSearch(poi, categoryKey, poi.name);

    if (places.length > 0) {
      setPlaces(places);
      setSelectedPlace(places[0]);
      setSearchQuery(poi.name);
      setSearchResults([]);
      setIsMenuOpen(false);
      addSearchToHistory(poi.name);

      setMessage('Result found');
      setMessageType("success");
    } else {
      setMessage(`No ${poi.name} found near your location.`);
      setMessageType("error");
      setPlaces([]);
      setSelectedPlace(null);
    }
  };

  return (
    <>
      {/* Desktop View */}
    <div className="search-container hidden lg:flex gap-3 gap-x-3 bg-white shadow-lg flex-col min-h-screen">
       
             <div className="search-box flex border-3 border-orange-500 rounded-xl px-3 py-2">

              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search places or addresses..."
                className="flex-1 h-[40px] focus:outline-none "
                
              />
              <button
                onClick={handleSearchSubmit}
                 className="ml-2 w-12 h-[40px] bg-orange-500 text-white rounded-md hover:bg-orange-600 flex justify-center items-center cursor-pointer"
                  >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </div>
           {message && (
          <div
            className={`error-message text-sm p-2 text-center rounded-md mb-2 ${
              messageType === "error"
                ? "text-red-500 bg-red-50"
                : messageType === "success"
                ? "text-gray-700 bg-gray-100"
                : "text-green-600 bg-green-50"
            }`}
          >
            {message}
          </div>
        )}


        <div className="quick-search">
          <h3 className="text-md font-semibold text-gray-600">Quick Search:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(poiCategories).map(([categoryKey, category]) => (
              <button
                key={categoryKey}
                onClick={() => handleQuickSearch(category.queries[0].name)}
                className="bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
              >
                {category.label}
              </button>
            ))}
            <button
              onClick={() => handleQuickSearch("Food Trucks")}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
            >
              Food Trucks
            </button>
          </div>
        </div>
        {searchResults.length > 0 && (
          <ul className="border border-gray-200 rounded-md shadow-sm bg-white max-h-60 overflow-y-auto z-10">
            {searchResults.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {place.place_name}
                {place.text && <div className="text-xs text-gray-500">{place.text}</div>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Search History</h3>
          {searchHistory.length === 0 ? (
            <p className="text-center text-gray-300 text-xs">No history yet.</p>
          ) : (
            <ul className="text-xs">
              {searchHistory.map((historyItem, index) => (
                <li key={index} className="mt-2 flex justify-between items-center">
                  <span
                    onClick={() => {
                      setSearchQuery(historyItem);
                      debouncedHandleSearch(historyItem);
                      handleSelectPlace({ place_name: historyItem, center: userPosition, text: historyItem });
                    }}
                    className="cursor-pointer hover:underline"
                  >
                    {historyItem}
                  </span>
                  <button
                    onClick={() => deleteSearchFromHistory(index)}
                    className="cursor-pointer text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="absolute left-3 top-4 z-[1000] text-3xl cursor-pointer lg:hidden"
        aria-label="Open search menu"
      >
        ☰
      </button>

      {isMenuOpen && (
       <div className="fixed top-0 bottom-0 z-[1000] flex justify-start lg:hidden bg-black/40"> 
          <div className="bg-white h-full shadow-lg w-[280px] md:w-[320px] flex flex-col px-6 py-4">
            <div className="flex flex-col gap-5">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="self-end text-2xl text-gray-600 hover:text-red-500 cursor-pointer"
              aria-label="Close search menu"
            >
              ✕
            </button>


         
         <div className="flex border-3 border-orange-500 rounded-xl px-3 py-2">

              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search places or addresses..."
                className="flex-1 h-[40px] focus:outline-none "
                
              />
              <button
                onClick={handleSearchSubmit}
                 className="ml-2 w-12 h-[40px] bg-orange-500 text-white rounded-md hover:bg-orange-600 flex justify-center items-center cursor-pointer"
                  >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </div>
              {message && (
              <div
                className={`text-sm p-2 text-center rounded-md mb-2 ${
                  messageType === "error"
                    ? "text-red-500 bg-red-50"
                    : messageType === "success"
                    ? "text-gray-700 bg-gray-100"
                    : "text-green-600 bg-green-50"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-600 text-center">Quick Search:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(poiCategories).map(([categoryKey, category]) => (
                  <button
                    key={categoryKey}
                    onClick={() => handleQuickSearch(category.queries[0].name)}
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
                  >
                    {category.label}
                  </button>
                ))}
                <button
                  onClick={() => handleQuickSearch("Food Trucks")}
                  className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
                >
                  Food Trucks
                </button>
              </div>
            </div>
            {searchResults.length > 0 && (
              <ul className="border border-gray-200 rounded-md shadow-sm bg-white max-h-60 overflow-y-auto z-10">
                {searchResults.map((place) => (
                  <li
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {place.place_name}
                    {place.text && <div className="text-xs text-gray-500">{place.text}</div>}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <h3 className="text-gray-600 text-2xl font-semibold mb-2 text-center">Search History</h3>
              {searchHistory.length === 0 ? (
                <p className="text-center text-gray-300 text-xs">No history yet.</p>
              ) : (
                <ul className="text-xs">
                  {searchHistory.map((historyItem, index) => (
                    <li key={index} className="mt-2 flex justify-between items-center">
                      <span
                        onClick={() => {
                          setSearchQuery(historyItem);
                          debouncedHandleSearch(historyItem);
                          handleSelectPlace({ place_name: historyItem, center: userPosition, text: historyItem });
                        }}
                        className="cursor-pointer hover:underline"
                      >
                        {historyItem}
                      </span>
                      <button
                        onClick={() => deleteSearchFromHistory(index)}
                        className="cursor-pointer text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
