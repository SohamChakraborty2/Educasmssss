
import React from 'react';

interface SuggestedSearchesProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

export const SuggestedSearches: React.FC<SuggestedSearchesProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
//Suggested Searches Option – A list of clickable suggestions