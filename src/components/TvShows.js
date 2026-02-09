import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const TvShows = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = parseInt(query.get('page')) || 1;
  const genreIdFromUrl = query.get('genre');

  const [tvShows, setTvShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenreId, setSelectedGenreId] = useState(genreIdFromUrl ? parseInt(genreIdFromUrl) : null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [heroShow, setHeroShow] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null);

  const formatISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const genrePromise = axios.get(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=en-US`, { signal });
      const endpoint = selectedGenreId
        ? `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&with_genres=${selectedGenreId}&sort_by=vote_average.desc&vote_count.gte=100&page=${page}`
        : `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&language=en-US&page=${page}`;
      const showsPromise = axios.get(endpoint, { signal });

      const [genreResponse, showsResponse] = await Promise.all([genrePromise, showsPromise]);

      const allGenres = [{ id: null, name: 'All' }, ...genreResponse.data.genres];
      setGenres(allGenres);
      const results = showsResponse.data.results.slice(0, 20);
      setTvShows(results);
      setTotalPages(Math.min(showsResponse.data.total_pages, 500));
      setHeroShow(results[0] || null);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('Failed to load TV shows. Please try again.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [selectedGenreId, page, API_KEY]);

  useEffect(() => {
    fetchData();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  useEffect(() => {
    if (heroShow && !preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroShow.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${heroShow.backdrop_path}`
        : `https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1920&auto=format&fit=crop`;
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
  }, [heroShow]);

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));
  const handleFilterClick = () => document.querySelector('.genres-section')?.scrollIntoView({ behavior: 'smooth' });

  // Compute selectedGenre once
  const selectedGenre = useMemo(() => 
    genres.find(g => g.id === selectedGenreId) || null
  , [genres, selectedGenreId]);

  // Dynamic Schema
  const schema = useMemo(() => {
    const genreName = selectedGenre?.name || 'All';
    const showList = tvShows.map(s => ({
      "@type": "ListItem",
      "position": tvShows.indexOf(s) + 1,
      "item": {
        "@type": "TVSeries",
        "name": s.name,
        "url": `https://gomovies.press/tv-show/${slugify(s.name)}-${s.id}`,
        "image": s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null,
        "datePublished": formatISODate(s.first_air_date),
        "genre": s.genre_ids?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', ')
      }
    }));

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
            { "@type": "ListItem", "position": 2, "name": "TV Shows", "item": "https://gomovies.press/tv-shows" },
            selectedGenre ? {
              "@type": "ListItem",
              "position": 3,
              "name": genreName,
              "item": `https://gomovies.press/tv-shows?genre=${selectedGenreId}`
            } : null
          ].filter(Boolean)
        },
        {
          "@type": "ItemList",
          "name": `${genreName} TV Shows`,
          "description": `Watch the best ${genreName.toLowerCase()} TV shows online free in HD on GoMovies.`,
          "numberOfItems": tvShows.length,
          "itemListElement": showList
        }
      ].filter(Boolean)
    };
  }, [tvShows, genres, selectedGenreId, selectedGenre]);

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

  const heroBackdrop = heroShow?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${heroShow.backdrop_path}`
    : `https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1920&auto=format&fit=crop`;
  const pageTitle = selectedGenre
    ? `${selectedGenre.name} TV Shows - Watch Free Online in HD - GoMovies`
    : `TV Shows - Latest & Popular Series Streaming Free - GoMovies`;
  const metaDesc = selectedGenre
    ? `Watch the best ${selectedGenre.name.toLowerCase()} TV shows online free in HD. No signup required. Stream now on GoMovies.`
    : `Discover latest TV shows streaming free in HD. Watch popular series online without signup on GoMovies.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`tv shows, watch tv shows online free, ${selectedGenre?.name || 'latest tv shows'}, stream tv hd, gomovies`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={heroBackdrop} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/tv-shows${selectedGenreId ? `?genre=${selectedGenreId}` : ''}${page > 1 ? `?page=${page}` : ''}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroBackdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={heroBackdrop}
              alt={`${heroShow?.name || 'TV Shows'} backdrop`}
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-blue-400">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">TV Shows</span>
              {selectedGenre && (
                <>
                  <span className="mx-2">›</span>
                  <span className="text-gray-400">{selectedGenre.name}</span>
                </>
              )}
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              {selectedGenre ? selectedGenre.name : 'TV Shows'}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
              {selectedGenre
                ? `Stream the best ${selectedGenre.name.toLowerCase()} TV shows free in HD`
                : 'Watch latest and popular TV shows online without signup'}
            </p>
            <button
              onClick={handleFilterClick}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Browse Genres
            </button>
          </div>
        </section>

        {/* Floating Filter */}
        <button
          onClick={handleFilterClick}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Filter by genre"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v3.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-5.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          {/* Genre Filters */}
          <section className="mb-16 genres-section">
            <h2 className="text-3xl font-bold text-center mb-8">Filter by Genre</h2>
            <div className="flex flex-wrap gap-3 justify-center max-w-5xl mx-auto">
              {genres.map(genre => (
                <Link
                  key={genre.id || 'all'}
                  to={`/tv-shows${genre.id ? `?genre=${genre.id}` : ''}`}
                  onClick={() => setSelectedGenreId(genre.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedGenreId === genre.id
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-800/70 text-gray-200 hover:bg-red-600/30 hover:text-white hover:shadow-md border border-gray-700/50'
                  }`}
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </section>

          {/* TV Show Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {tvShows.map(show => (
                <Link
                  key={show.id}
                  to={`/tv-show/${slugify(show.name)}-${show.id}`}
                  className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-800/50"
                >
                  <div className="relative aspect-[2/3]">
                    <img
                      src={imageErrors[show.id] || !show.poster_path
                        ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                        : `https://image.tmdb.org/t/p/w300${show.poster_path}`
                      }
                      alt={`${show.name} poster`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(show.id)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    {show.vote_average > 0 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        {show.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                      {show.name}
                    </h3>
                    <p className="text-xs text-gray-400">{show.first_air_date?.split('-')[0] || 'N/A'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Pagination */}
          <nav className="flex justify-center items-center gap-4 mt-12" aria-label="Pagination">
            <Link
              to={`/tv-shows?page=${page > 1 ? page - 1 : 1}${selectedGenreId ? `&genre=${selectedGenreId}` : ''}`}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                page === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }`}
              aria-disabled={page === 1}
              onClick={e => page === 1 && e.preventDefault()}
            >
              Previous
            </Link>
            <span className="text-lg font-medium text-gray-300">
              Page <span className="text-red-400">{page}</span> of {totalPages}
            </span>
            <Link
              to={`/tv-shows?page=${page + 1}${selectedGenreId ? `&genre=${selectedGenreId}` : ''}`}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                page >= totalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }`}
              aria-disabled={page >= totalPages}
              onClick={e => page >= totalPages && e.preventDefault()}
            >
              Next
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default TvShows;