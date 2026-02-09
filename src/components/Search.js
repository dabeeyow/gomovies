import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMetaTags } from "../useMetaTags";

const Search = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      const encodedQuery = encodeURIComponent(query.trim());
      navigate(`/search?q=${encodedQuery}`);
    }
  };

  useMetaTags(
    "Search Movies and TV Shows",
    "Search for your favorite movies and TV shows on GoMovies."
  );

  return (
    <form
      onSubmit={handleSearch}
      className="flex gap-2 flex-wrap justify-center md:justify-start"
    >
      <div class="flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-gray-600 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-500">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies or TV shows..."
          className="block min-w-0 grow bg-gray-800 py-1.5 pr-3 pl-1 w-45 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
        />
      </div>
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
      >
        Search
      </button>
    </form>
  );
};

export default Search;
