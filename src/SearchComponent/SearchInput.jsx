import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function SearchInput({ searchQuery, setSearchQuery, onSearch }) {
  return (
    <div className="flex mb-4 rounded-md">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search places or addresses..."
        className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={onSearch}
        className="w-16 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex justify-center items-center"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </button>
    </div>
  );
}
