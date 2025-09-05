import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

// A utility function to debounce API calls and other expensive operations.
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

// The main SearchBar component for searching points of interest and addresses.
export default function SearchBar({ userPosition, setPlaces, setSelectedPlace }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [message, setMessage] = useState(""); // State for displaying messages to the user

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

    // IMPORTANT: Make sure this Mapbox token is valid. An invalid token will cause the search to fail silently.
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
          center: f.center, // Mapbox returns [longitude, latitude]
          text: f.text,
          properties: f.properties,
          markerColor: "blue",
          source: "mapbox", // Identify the source of the data
        })) || [];

      return features;
    } catch (err) {
      console.error("Mapbox Geocoding API error:", err);
      return [];
    }
  };

  // Debounced handler for text input changes
  const debouncedHandleSearch = debounce(async (value) => {
    if (!userPosition || value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let foundPlaces = [];

    // Prioritize a quick, specific POI search
    for (const categoryKey in poiCategories) {
      for (const poi of poiCategories[categoryKey].queries) {
        if (value.toLowerCase().includes(poi.name.toLowerCase())) {
          foundPlaces = await performOverpassSearch(poi, categoryKey, poi.name);
          break;
        }
      }
      if (foundPlaces.length > 0) break;
    }

    // If no specific POI was found via keywords, or if input is more generic, try Mapbox
    if (foundPlaces.length === 0) {
      foundPlaces = await performMapboxSearch(value);
    }
    
    setSearchResults(foundPlaces);
  }, 300);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setMessage(""); // Clear message on new input
    debouncedHandleSearch(value);
  };

  // Handles selecting a place from the dropdown
  const handleSelectPlace = (place) => {
    let leafletPosition = place.center;

    // Correct the coordinate order for Mapbox results
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

  // Handles submitting the search query via the button
  const handleSearchSubmit = async () => {
    if (!searchQuery || !userPosition) {
      setMessage("Please enter a search query or wait for your location to be determined.");
      return;
    }
    
    let foundPlaces = [];

    // Prioritize POI search first
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
      setMessage(""); // Clear message on success
    } else {
      setMessage("No results found for your search.");
      setPlaces([]);
      setSelectedPlace(null);
    }
  };

  // Handles quick search button clicks
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
    
    setMessage(""); // Clear message before searching
    const places = await performOverpassSearch(poi, categoryKey, poi.name);

    if (places.length > 0) {
      setPlaces(places);
      setSelectedPlace(places[0]);
      setSearchQuery(poi.name);
      setSearchResults([]);
      setIsMenuOpen(false);
      addSearchToHistory(poi.name);
    } else {
      setMessage(`No ${poi.name} found near your location.`);
      setPlaces([]);
      setSelectedPlace(null);
    }
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:flex w-[22%] bg-white p-6 shadow-lg flex-col min-h-screen">
        <h1 className="text-xl font-bold mb-4">Search Locations</h1>
        <div className="flex mb-4 rounded-md">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search places or addresses..."
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearchSubmit}
            className="w-16 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex justify-center items-center"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
        {message && (
          <div className="text-sm text-red-500 p-2 text-center rounded-md bg-red-50 mb-2">{message}</div>
        )}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Quick Search:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(poiCategories).map(([categoryKey, category]) => (
              <button
                key={categoryKey}
                onClick={() => handleQuickSearch(category.queries[0].name)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
              >
                {category.label}
              </button>
            ))}
            <button
              onClick={() => handleQuickSearch("Food Trucks")}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
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
        className="absolute left-3 top-4 z-[1000] p-2 text-3xl lg:hidden"
        aria-label="Open search menu"
      >
        ☰
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-start lg:hidden">
          <div className="bg-white h-full shadow-lg p-6 w-80 md:w-120 flex flex-col">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="self-end p-2 text-2xl text-gray-600 hover:text-red-500"
              aria-label="Close search menu"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">Search</h2>

            <div className="flex mb-4 rounded-md">
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search places or addresses..."
                className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSearchSubmit}
                className="w-16 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex justify-center items-center"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </div>
            {message && (
              <div className="text-sm text-red-500 p-2 text-center rounded-md bg-red-50 mb-2">{message}</div>
            )}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Quick Search:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(poiCategories).map(([categoryKey, category]) => (
                  <button
                    key={categoryKey}
                    onClick={() => handleQuickSearch(category.queries[0].name)}
                    className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
                  >
                    {category.label}
                  </button>
                ))}
                <button
                  onClick={() => handleQuickSearch("Food Trucks")}
                  className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
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
        </div>
      )}
    </>
  );
}
