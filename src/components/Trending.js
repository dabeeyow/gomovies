import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const Trending = () => {
  const [activeTab, setActiveTab] = useState('day');
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch movies and TV trending
        const [moviesRes, tvRes] = await Promise.all([
          axios.get(`${BASE_URL}/trending/movie/${activeTab}?api_key=${API_KEY}`),
          axios.get(`${BASE_URL}/trending/tv/${activeTab}?api_key=${API_KEY}`)
        ]);

        // Combine and slice top 20
        const combined = [
          ...moviesRes.data.results.map(item => ({ ...item, type: 'Movie' })).slice(0, 10),
          ...tvRes.data.results.map(item => ({ ...item, type: 'TV' })).slice(0, 10)
        ].slice(0, 20);

        setTrending(combined);
      } catch (err) {
        setError('Failed to fetch trending data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, [activeTab, API_KEY]);

  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": "Trending", "item": "https://gomovies.press/trending" }
        ]
      },
      {
        "@type": "ItemList",
        "name": `Trending ${activeTab === 'day' ? 'Today' : activeTab === 'week' ? 'This Week' : 'This Month'}`,
        "description": "Top trending movies and TV shows on GoMovies.",
        "numberOfItems": trending.length,
        "itemListElement": trending.slice(0, 5).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": item.type === 'Movie' ? "Movie" : "TVSeries",
            "name": item.title || item.name,
            "url": item.type === 'Movie' 
              ? `https://gomovies.press/movie/${slugify(item.title)}-${item.id}`
              : `https://gomovies.press/tv-show/${slugify(item.name)}-${item.id}`,
            "image": item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            "datePublished": item.release_date || item.first_air_date
          }
        }))
      }
    ]
  }), [trending, activeTab]);

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

    const heroImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop';

  return (
    <>
      <Helmet>
        <title>Trending Now - GoMovies</title>
        <meta name="description" content={`Trending ${activeTab === 'day' ? 'Today' : activeTab === 'week' ? 'This Week' : 'This Month'}: Top movies and TV shows.`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <img
            src={heroImage}
            alt="Trending on GoMovies"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-red-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">Trending</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              Trending Now
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              What's hot <span className="text-red-400 font-bold">today</span>
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { key: 'day', label: 'Today' },
                { key: 'week', label: 'Week' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-8 py-3 rounded-full font-bold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                      : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trending.map((item, index) => (
              <Link
                key={item.id}
                to={item.type === 'Movie' ? `/movie/${slugify(item.title)}-${item.id}` : `/tv-show/${slugify(item.name)}-${item.id}`}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="aspect-[2/3]">
                  <img
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://placehold.co/300x450/gray/white?text=No+Image'}
                    alt={`${item.title || item.name} - Trending ${activeTab}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-sm px-2 py-1 rounded-full shadow-lg">
                  #{index + 1}
                </div>
                <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-2.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {item.vote_average?.toFixed(1)}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-bold text-sm truncate">{item.title || item.name}</h3>
                  <p className="text-gray-300 text-xs flex items-center gap-2">
                    <span className="bg-red-600/80 px-1.5 py-0.5 rounded text-xs">{item.type}</span>
                    <span>{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Trending;