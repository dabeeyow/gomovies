import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const GenreDetail = () => {
  const { slugId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const moviePage = parseInt(query.get('moviePage')) || 1;
  const tvPage = parseInt(query.get('tvPage')) || 1;
  const id = useMemo(() => slugId?.split('-').filter(part => part).pop(), [slugId]);

  const [genre, setGenre] = useState(null);
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [movieTotalPages, setMovieTotalPages] = useState(1);
  const [tvTotalPages, setTvTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState('movies');
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

  const fetchGenreData = useCallback(async () => {
    if (!id || isNaN(id)) {
      setError('Invalid genre ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const genrePromise = axios.get(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`, { signal });
      const moviePromise = axios.get(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=${id}&sort_by=vote_average.desc&vote_count.gte=100&page=${moviePage}`, { signal });
      const tvPromise = axios.get(`${BASE_URL}/discover/tv?api_key=${API_KEY}&language=en-US&with_genres=${id}&sort_by=vote_average.desc&vote_count.gte=100&page=${tvPage}`, { signal });

      const [genreResponse, movieResponse, tvResponse] = await Promise.all([genrePromise, moviePromise, tvPromise]);

      const foundGenre = genreResponse.data.genres.find(g => g.id === parseInt(id));
      if (!foundGenre) {
        setError('Genre not found');
        setLoading(false);
        return;
      }
      setGenre(foundGenre);
      setMovies(movieResponse.data.results.slice(0, 20));
      setTvShows(tvResponse.data.results.slice(0, 20));
      setMovieTotalPages(Math.min(movieResponse.data.total_pages, 500));
      setTvTotalPages(Math.min(tvResponse.data.total_pages, 500));
      setHeroItem(movieResponse.data.results[0] || tvResponse.data.results[0] || null);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('Failed to load genre details. Please try again.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, moviePage, tvPage, API_KEY]);

  useEffect(() => {
    fetchGenreData();
    window.scrollTo(0, 0);
    return () => abortControllerRef.current?.abort();
  }, [fetchGenreData]);

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

  const currentItems = activeTab === 'movies' ? movies : tvShows;
  const currentTotalPages = activeTab === 'movies' ? movieTotalPages : tvTotalPages;
  const currentPage = activeTab === 'movies' ? moviePage : tvPage;

  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": "Genres", "item": "https://gomovies.press/genres" },
          { "@type": "ListItem", "position": 3, "name": genre?.name, "item": `https://gomovies.press/genre/${slugify(genre?.name)}-${id}` }
        ]
      },
      {
        "@type": "ItemList",
        "name": `${genre?.name} ${activeTab === 'movies' ? 'Movies' : 'TV Shows'}`,
        "description": `Watch free ${genre?.name.toLowerCase()} ${activeTab === 'movies' ? 'movies' : 'TV shows'} in HD on GoMovies.`,
        "numberOfItems": currentItems.length,
        "itemListElement": currentItems.slice(0, 5).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": activeTab === 'movies' ? "Movie" : "TVSeries",
            "name": item.title || item.name,
            "url": activeTab === 'movies' 
              ? `https://gomovies.press/movie/${slugify(item.title)}-${item.id}`
              : `https://gomovies.press/tv-show/${slugify(item.name)}-${item.id}`,
            "image": item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            "datePublished": formatISODate(item.release_date || item.first_air_date)
          }
        }))
      }
    ]
  }), [genre, id, currentItems, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error || !genre) {
    return (
      <div className="text-center py-20 text-red-400 text-2xl bg-gray-900 min-h-screen">
        {error || "Genre not found."}
      </div>
    );
  }

  const heroBackdrop = heroItem?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${heroItem.backdrop_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;
  const pageTitle = `${genre.name} ${activeTab === 'movies' ? 'Movies' : 'TV Shows'} - Free HD Streaming - GoMovies`;
  const metaDesc = `Watch the best ${genre.name.toLowerCase()} ${activeTab === 'movies' ? 'movies' : 'TV shows'} online free in HD on GoMovies. No signup required.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${genre.name.toLowerCase()} movies, ${genre.name.toLowerCase()} tv shows, watch ${genre.name.toLowerCase()} online free, free hd streaming, gomovies ${genre.name.toLowerCase()}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={heroBackdrop} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/genre/${slugify(genre.name)}-${id}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroBackdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={heroBackdrop}
              alt={`${genre.name} genre backdrop`}
              className="absolute inset-0 w-full h-full object-cover"
              fetchpriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-red-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <Link to="/genres" className="hover:text-red-400 transition-colors">Genres</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{genre.name}</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              {genre.name}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Best <span className="text-red-400 font-bold">{genre.name.toLowerCase()}</span> movies & TV shows
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveTab('movies')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeTab === 'movies'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                    : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setActiveTab('tv')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeTab === 'tv'
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                    : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                }`}
              >
                TV Shows
              </button>
            </div>
          </div>
        </section>

        {/* Floating CTA */}
        <button
          onClick={() => document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Explore genre"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 -mt-20 relative z-10 content-section">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {currentItems.map(item => (
              <Link
                key={item.id}
                to={activeTab === 'movies' ? `/movie/${slugify(item.title)}-${item.id}` : `/tv-show/${slugify(item.name)}-${item.id}`}
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
          </div>

          {/* Pagination */}
          <nav className="flex justify-center items-center gap-4 mt-12" aria-label="Pagination">
            <Link
              to={`/genre/${slugId}?moviePage=${activeTab === 'movies' ? (moviePage > 1 ? moviePage - 1 : 1) : moviePage}&tvPage=${activeTab === 'tv' ? (tvPage > 1 ? tvPage - 1 : 1) : tvPage}`}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                currentPage === 1
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }`}
              aria-disabled={currentPage === 1}
              onClick={e => currentPage === 1 && e.preventDefault()}
            >
              Previous
            </Link>
            <span className="text-lg font-medium text-gray-300">
              Page <span className="text-red-400">{currentPage}</span> of {currentTotalPages}
            </span>
            <Link
              to={`/genre/${slugId}?moviePage=${activeTab === 'movies' ? moviePage + 1 : moviePage}&tvPage=${activeTab === 'tv' ? tvPage + 1 : tvPage}`}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                currentPage >= currentTotalPages
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
              }`}
              aria-disabled={currentPage >= currentTotalPages}
              onClick={e => currentPage >= currentTotalPages && e.preventDefault()}
            >
              Next
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default GenreDetail;