import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const Genres = () => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('movie');

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      try {
        const [movieRes, tvRes] = await Promise.all([
          axios.get(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en`),
          axios.get(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=en`)
        ]);

        setMovieGenres(movieRes.data.genres);
        setTvGenres(tvRes.data.genres);
      } catch (err) {
        setError('Failed to load genres. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, [API_KEY]);

  const currentGenres = activeTab === 'movie' ? movieGenres : tvGenres;

  const heroImage = 'https://images.unsplash.com/photo-1693735278628-80e3f9cd42d1?q=80&w=1920&auto=format&fit=crop';
  const preloadLinkRef = React.useRef(null);

  useEffect(() => {
    if (!preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroImage;
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
  }, []);

  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": "Genres", "item": "https://gomovies.press/genres" }
        ]
      },
      {
        "@type": "ItemList",
        "name": `${activeTab === 'movie' ? 'Movie' : 'TV'} Genres on GoMovies`,
        "description": `Browse ${activeTab === 'movie' ? 'movie' : 'TV show'} genres on GoMovies. Free HD streaming in the Philippines.`,
        "numberOfItems": currentGenres.length,
        "itemListElement": currentGenres.map((genre, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Thing",
            "name": genre.name,
            "url": `https://gomovies.press/genre/${slugify(genre.name)}-${genre.id}`
          }
        }))
      }
    ]
  }), [currentGenres, activeTab]);

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
        <title>All Genres - GoMovies | Movies & TV Shows by Category</title>
        <meta name="description" content="Explore all movie and TV show genres on GoMovies. Stream Action, Drama, Comedy, Horror and more in HD for free in the Philippines." />
        <meta name="keywords" content="movie genres, tv genres, action movies philippines, comedy tv shows, gomovies genres, free streaming by genre" />
        <meta property="og:title" content="Browse Genres - GoMovies Philippines" />
        <meta property="og:description" content="Find your favorite genre. Free HD streaming of movies and TV shows in the Philippines." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content="https://gomovies.press/genres" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://gomovies.press/genres" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroImage.replace('w=1920', 'w=780')} media="(max-width: 768px)" />
            <img
              src={heroImage}
              alt="Browse movie and TV genres on GoMovies"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-red-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">Genres</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              All Genres
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Find your <span className="text-red-400 font-bold">perfect watch</span> in the Philippines
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setActiveTab('movie')}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeTab === 'movie'
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

        {/* Genres Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {currentGenres.map((genre) => (
              <Link
                key={genre.id}
                to={`/genre/${slugify(genre.name)}-${genre.id}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-gray-800 to-gray-700"
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-red-400 transition-colors">
                    {genre.name}
                  </h3>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-400 text-lg mb-6">
              Can’t decide? Try our <Link to="/trending" className="text-red-400 hover:text-red-300 font-bold">Trending</Link> page
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Genres;