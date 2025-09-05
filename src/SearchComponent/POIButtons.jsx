export default function POIButtons({ poiCategories, onQuickSearch }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">Quick Search:</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(poiCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => onQuickSearch(category.queries[0].name)}
            className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
          >
            {category.label}
          </button>
        ))}
        <button
          onClick={() => onQuickSearch("Food Trucks")}
          className="px-3 py-1.5 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors text-gray-700"
        >
          Food Trucks
        </button>
      </div>
    </div>
  );
}
