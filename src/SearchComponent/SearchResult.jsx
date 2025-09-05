export default function SearchResults({ searchResults, onSelectPlace }) {
  if (!searchResults || searchResults.length === 0) return null;

  return (
    <ul className="border border-gray-200 rounded-md shadow-sm bg-white max-h-60 overflow-y-auto z-10">
      {searchResults.map((place) => (
        <li
          key={place.id}
          onClick={() => onSelectPlace(place)}
          className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
        >
          {place.place_name}
          {place.text && <div className="text-xs text-gray-500">{place.text}</div>}
        </li>
      ))}
    </ul>
  );
}
