export default function SearchHistory({ history, onSelectHistory, onDeleteHistory }) {
  if (!history || history.length === 0)
    return <p className="text-center text-gray-300 text-xs">No history yet.</p>;

  return (
    <ul className="text-xs">
      {history.map((item, index) => (
        <li key={index} className="mt-2 flex justify-between items-center">
          <span
            onClick={() => onSelectHistory(item)}
            className="cursor-pointer hover:underline"
          >
            {item}
          </span>
          <button
            onClick={() => onDeleteHistory(index)}
            className="cursor-pointer text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
