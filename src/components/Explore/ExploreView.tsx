import React, { useState, useEffect } from "react";
import { SearchBar } from "../shared/SearchBar";
import { Loading } from "../shared/Loading";
import { useApi } from "../../hooks/useApi";

interface ExploreViewProps {
  initialQuery?: string;
}

const ExploreView: React.FC<ExploreViewProps> = ({ initialQuery = "" }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (query) fetchResults(query);
  }, [query]);

  const fetchResults = async (searchTerm: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="explore-view">
      <SearchBar value={query} onChange={setQuery} onSearch={fetchResults} />
      {loading && <Loading />}
      <div className="results-container">{results && JSON.stringify(results)}</div>
    </div>
  );
};

export default ExploreView;
