import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const SearchResults = () => {
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get('q') || '';
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('multi'); // Options: multi, movie, tv
  const [imageErrors, setImageErrors] = useState({});
  const [heroItem, setHeroItem] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null);

  const formatISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const fetchResults = useCallback(async () => {
    if (!queryParam) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const endpoint = filter === 'movie'
        ? `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(queryParam)}&page=${page}`
        : filter === 'tv'
        ? `${BASE_URL}/search/tv?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(queryParam)}&page=${page}`
        : `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(queryParam)}&page=${page}`;
      const { data } = await axios.get(endpoint, { signal });
      const filteredResults = data.results.filter(item => item.media_type !== 'person').slice(0, 20);
      setResults(filteredResults);
      setTotalPages(Math.min(data.total_pages, 500));
      setHeroItem(filteredResults[0] || null);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [queryParam, filter, page, API_KEY]);

  useEffect(() => {
    fetchResults();
    window.scrollTo(0, 0);
    return () => abortControllerRef.current?.abort();
  }, [fetchResults]);

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
  const handleFilterClick = () => document.querySelector('.filter-section')?.scrollIntoView({ behavior: 'smooth' });

  // Schema.org - ItemList for results
  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": "Search", "item": `https://gomovies.press/search?q=${encodeURIComponent(queryParam)}` }
        ]
      },
      {
        "@type": "ItemList",
        "name": `Search Results for "${queryParam}"`,
        "description": `Free streaming results for "${queryParam}" on GoMovies. Movies and TV shows in HD.`,
        "numberOfItems": results.length,
        "itemListElement": results.slice(0, 5).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": item.media_type === 'movie' ? "Movie" : "TVSeries",
            "name": item.title || item.name,
            "url": item.media_type === 'movie' 
              ? `https://gomovies.press/movie/${slugify(item.title)}-${item.id}`
              : `https://gomovies.press/tv-show/${slugify(item.name)}-${item.id}`,
            "image": item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            "datePublished": formatISODate(item.release_date || item.first_air_date)
          }
        }))
      }
    ]
  }), [queryParam, results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  const heroBackdrop = heroItem?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;
  const pageTitle = `Search "${queryParam}" - Free Movies & TV Shows Streaming - GoMovies`;
  const metaDesc = `Results for "${queryParam}" on GoMovies. Watch free HD movies and TV shows matching your search. No signup required.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${queryParam} streaming, watch ${queryParam} online free, ${queryParam} movies, ${queryParam} tv shows, gomovies search`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={heroBackdrop} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/search?q=${encodeURIComponent(queryParam)}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroBackdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={heroBackdrop}
              alt={`Search results for "${queryParam}" backdrop`}
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
              <span className="text-gray-400">Search</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              Results for "<span className="text-red-500">{queryParam}</span>"
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6">
              Found {results.length} results • Page {page}
            </p>
            <button
              onClick={handleFilterClick}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Filter Results
            </button>
          </div>
        </section>

        {/* Floating Filter */}
        <button
          onClick={handleFilterClick}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Filter results"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v3.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-5.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          {/* Filters */}
          <section className="mb-16 filter-section">
            <h2 className="text-3xl font-bold text-center mb-8">Filter Results</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setFilter('multi')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  filter === 'multi'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                    : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('movie')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  filter === 'movie'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                    : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setFilter('tv')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  filter === 'tv'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                    : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                TV Shows
              </button>
            </div>
          </section>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((item) => {
              const title = item.title || item.name;
              const release_date = item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A';
              const to = item.media_type === 'movie' || filter === 'movie'
                ? `/movie/${slugify(title)}-${item.id}`
                : `/tv-show/${slugify(title)}-${item.id}`;

              return (
                <Link
                  key={item.id}
                  to={to}
                  className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-800/50"
                >
                  <div className="relative aspect-[2/3]">
                    <img
                      src={imageErrors[item.id] || !item.poster_path
                        ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                        : `https://image.tmdb.org/t/p/w300${item.poster_path}`
                      }
                      alt={`${title} poster`}
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
                      {title}
                    </h3>
                    <p className="text-xs text-gray-400">{release_date}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* No Results */}
          {!results.length && (
            <div className="text-center py-20">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <h2 className="text-3xl font-bold mb-2">No Results Found</h2>
              <p className="text-gray-400">Try different keywords or check spelling.</p>
            </div>
          )}

          {/* Pagination */}
          {results.length > 0 && (
            <nav className="flex justify-center items-center gap-4 mt-12" aria-label="Pagination">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  page === 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
                aria-disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-lg font-medium text-gray-300">
                Page <span className="text-red-400">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={page >= totalPages}
                className={`px-6 py-3 rounded-full font-bold transition-all ${
                  page >= totalPages
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                }`}
                aria-disabled={page >= totalPages}
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

export default SearchResults;