import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import axios from "axios";
import { motion } from "framer-motion";
import { slugify } from "../utils/slugify";

const FilterPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const type = searchParams.get("type") || "movie";
  const genre = searchParams.get("genre") || "";
  const year = searchParams.get("year") || "";
  const sort = searchParams.get("sort") || "popularity.desc";
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page")) || 1;

  const [items, setItems] = useState([]);
  const [genres, setGenres] = useState([]);
  const [years, setYears] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [heroItem, setHeroItem] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null);

  const formatISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const fetchGenres = useCallback(async () => {
    try {
      const endpoint =
        type === "movie" ? "/genre/movie/list" : "/genre/tv/list";
      const { data } = await axios.get(
        `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US`
      );
      setGenres(data.genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  }, [type, API_KEY]);

  const fetchYears = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const yearsArray = [];
    for (let y = currentYear; y >= 1900; y--) {
      yearsArray.push(y.toString());
    }
    setYears(yearsArray);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      let endpoint = "";
      const params = {
        api_key: API_KEY,
        language: "en-US",
        page,
        sort_by: sort,
      };

      if (query) {
        endpoint = type === "movie" ? "/search/movie" : "/search/tv";
        params.query = query;
      } else {
        endpoint = type === "movie" ? "/discover/movie" : "/discover/tv";
        if (genre) params.with_genres = genre;
        if (year) {
          if (type === "movie") {
            params.primary_release_year = year;
          } else {
            params.first_air_date_year = year;
          }
        }
      }

      const { data } = await axios.get(`${BASE_URL}${endpoint}`, { params, signal });
      setItems(data.results.slice(0, 20));
      setTotalPages(Math.min(data.total_pages, 500));
      setHeroItem(data.results[0] || null);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('Failed to load results. Please try again.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [type, genre, year, sort, query, page, API_KEY]);

  useEffect(() => {
    fetchGenres();
    fetchYears();
    fetchItems();
    window.scrollTo(0, 0);
    return () => abortControllerRef.current?.abort();
  }, [fetchGenres, fetchYears, fetchItems]);

  // Preload Hero
  useEffect(() => {
    if (heroItem && !preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroItem.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`
        : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;
      document.head.appendChild(link);
      preloadLinkRef.current = link;
    }
    return () => {
      const link = preloadLinkRef.current;
      if (link && document.head.contains(link)) {
        document.head.removeChild(link);
      }
      preloadLinkRef.current = null;
    };
  }, [heroItem]);

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  const updateParams = (newParams) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.set('page', '1'); // Reset page on filter change
      return params;
    });
  };

  // Fixed Pagination: Now correctly updates URL and triggers re-fetch
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('page', newPage.toString());
      return params;
    });
  };

  // Dynamic Schema
  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": type === "movie" ? "Movies" : "TV Shows", "item": `https://gomovies.press/${type === "movie" ? "movies" : "tv-shows"}` },
          { "@type": "ListItem", "position": 3, "name": genres.find(g => g.id === parseInt(genre))?.name || "Filtered Results" }
        ]
      },
      {
        "@type": "ItemList",
        "name": `${type === "movie" ? "Filtered Movies" : "Filtered TV Shows"}`,
        "description": `Discover ${type === "movie" ? "movies" : "TV shows"} by genre, year, and more on GoMovies.`,
        "numberOfItems": items.length,
        "itemListElement": items.slice(0, 5).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": type === "movie" ? "Movie" : "TVSeries",
            "name": item.title || item.name,
            "url": type === "movie" 
              ? `https://gomovies.press/movie/${slugify(item.title)}-${item.id}`
              : `https://gomovies.press/tv-show/${slugify(item.name)}-${item.id}`,
            "image": item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            "datePublished": formatISODate(item.release_date || item.first_air_date)
          }
        }))
      }
    ]
  }), [type, genre, genres, items]);

  const heroBackdrop = heroItem?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;
  const pageTitle = `${genre ? genres.find(g => g.id === parseInt(genre))?.name : 'Filtered'} ${type === "movie" ? 'Movies' : 'TV Shows'} ${year ? `(${year})` : ''} - GoMovies`;
  const metaDesc = `Watch free ${genre ? genres.find(g => g.id === parseInt(genre))?.name.toLowerCase() : ''} ${type === "movie" ? 'movies' : 'TV shows'} from ${year || 'all years'} in HD on GoMovies. Sorted by ${sort.replace('.', ' ')}.`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-400 text-2xl bg-gray-900 min-h-screen">
        {error}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${genre ? genres.find(g => g.id === parseInt(genre))?.name.toLowerCase() : 'all'} ${type}, watch free ${type}, hd streaming ${type}, gomovies ${type}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={heroBackdrop} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={window.location.href} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroBackdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={heroBackdrop}
              alt={`${genre ? genres.find(g => g.id === parseInt(genre))?.name : 'Filtered'} ${type}`}
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{genre ? genres.find(g => g.id === parseInt(genre))?.name : 'Filter'}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              {genre ? genres.find(g => g.id === parseInt(genre))?.name : 'Filtered'} {type === "movie" ? 'Movies' : 'TV Shows'}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6">
              {year ? `From ${year}` : ''} • Sorted by {sort.replace('.', ' ')}
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          {/* Filters */}
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="filter-section bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-700/50 shadow-2xl mb-12"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Refine Your Search</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => updateParams({ type: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
                >
                  <option value="movie">Movies</option>
                  <option value="tv">TV Shows</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => updateParams({ genre: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
                >
                  <option value="">All Genres</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={year}
                  onChange={(e) => updateParams({ year: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
                >
                  <option value="">All Years</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
                >
                  <option value="popularity.desc">Popularity Desc</option>
                  <option value="popularity.asc">Popularity Asc</option>
                  <option value="vote_average.desc">Rating Desc</option>
                  <option value="vote_average.asc">Rating Asc</option>
                  <option value="release_date.desc">Newest First</option>
                  <option value="release_date.asc">Oldest First</option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Results Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {items.map(item => (
              <Link
                key={item.id}
                to={type === "movie" ? `/movie/${slugify(item.title)}-${item.id}` : `/tv-show/${slugify(item.name)}-${item.id}`}
                className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-800/50"
              >
                <div className="relative aspect-[2/3]">
                  <img
                    src={imageErrors[item.id] || !item.poster_path
                      ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                      : `https://image.tmdb.org/t/p/w300${item.poster_path}`
                    }
                    alt={`${item.title || item.name} poster`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(item.id)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  {item.vote_average > 0 && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {item.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                    {item.title || item.name}
                  </h3>
                  <p className="text-xs text-gray-400">{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}</p>
                </div>
              </Link>
            ))}
          </motion.div>

          {/* Fixed Pagination */}
          {items.length > 0 && totalPages > 1 && (
            <nav className="flex justify-center items-center gap-4 mt-12" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  page === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                Previous
              </button>

              <span className="text-lg font-medium text-gray-300">
                Page <span className="text-red-400">{page}</span> of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  page === totalPages
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterPage;