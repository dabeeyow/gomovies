import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const HomePage = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [latestMovies, setLatestMovies] = useState([]);
//   const [popularTV, setPopularTV] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';

  const carouselRef = useRef(null);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Step 1: Fetch trending & latest movies (without credits)
        const [trendingRes, latestRes, trendingTVRes] = await Promise.all([
          axios.get(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`),
          axios.get(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`),
          axios.get(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`)
        ]);

        const trendingIds = trendingRes.data.results.slice(0, 10).map(m => m.id);
        const latestIds = latestRes.data.results.slice(0, 10).map(m => m.id);

        // Step 2: Fetch credits for each movie ID in parallel
        const fetchCredits = async (ids) => {
          const creditRequests = ids.map(id =>
            axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`)
              .catch(() => ({ data: { id, credits: { crew: [], cast: [] } } })) // Fallback
          );
          const responses = await Promise.all(creditRequests);
          return responses.map(res => {
            const movie = res.data;
            const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A';
            const topCast = movie.credits?.cast?.slice(0, 3).map(a => a.name).join(', ') || 'N/A';
            return {
              ...trendingRes.data.results.find(m => m.id === movie.id) || latestRes.data.results.find(m => m.id === movie.id),
              director,
              topCast
            };
          });
        };

        const [trendingWithCredits, latestWithCredits] = await Promise.all([
          fetchCredits(trendingIds),
          fetchCredits(latestIds)
        ]);

        setTrendingMovies(trendingWithCredits);
        setLatestMovies(latestWithCredits);
        setTrendingTV(trendingTVRes.data.results.slice(0, 10));
        // setPopularTV(popularTVRes.data.results.slice(0, 10));
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, [API_KEY]);

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  const scrollCarousel = useCallback((direction, ref) => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({
        left: direction === 'prev' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  // Structured Data (JSON-LD) - Critical for SEO
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "url": "https://gomovies.press",
        "name": "GoMovies",
        "description": "Watch movies and TV shows online for free in HD. Stream the latest releases, trending series, and classics without registration.",
        "publisher": {
          "@type": "Organization",
          "name": "GoMovies",
          "logo": {
            "@type": "ImageObject",
            "url": "https://gomovies.press/logo.png"
          }
        }
      },
      {
        "@type": "ItemList",
        "name": "Trending Movies This Week",
        "itemListElement": trendingMovies.slice(0, 5).map((movie, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Movie",
            "name": movie.title,
            "url": `https://gomovies.press/movie/${slugify(movie.title)}-${movie.id}`,
            "image": `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
            "datePublished": movie.release_date,
            "director": {
              "@type": "Person",
              "name": movie.director
            },
            "actor": movie.topCast.split(', ').map(name => ({
              "@type": "Person",
              "name": name.trim()
            })),
            "aggregateRating": movie.vote_average ? {
              "@type": "AggregateRating",
              "ratingValue": movie.vote_average.toFixed(1) / 2,
              "reviewCount": movie.vote_count
            } : undefined
          }
        }))
      },
      {
        "@type": "ItemList",
        "name": "Trending TV Shows This Week",
        "itemListElement": trendingTV.slice(0, 5).map((show, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "TVSeries",
            "name": show.name,
            "url": `https://gomovies.press/tv-show/${slugify(show.name)}-${show.id}`,
            "image": `https://image.tmdb.org/t/p/w300${show.poster_path}`,
            "startDate": show.first_air_date
          }
        }))
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>GoMovies - Watch Movies & TV Shows Online Free in HD</title>
        <meta name="description" content="Stream thousands of movies and TV shows for free in HD. No signup required. Watch the latest releases, trending series, and classics instantly on GoMovies." />
        <meta name="keywords" content="watch movies online free, free streaming, HD movies, TV shows online, stream movies, GoMovies" />
        <meta property="og:title" content="GoMovies - Free Movie Streaming" />
        <meta property="og:description" content="Watch movies and TV shows online for free in HD quality. No registration needed." />
        <meta property="og:image" content={`https://image.tmdb.org/t/p/w780${trendingMovies[0]?.backdrop_path || '/fallback.jpg'}`} />
        <meta property="og:url" content="https://gomovies.press" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section - Fast LCP */}
        <section className="relative h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-gray-900">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <picture>
            <source
              srcSet={`
                https://image.tmdb.org/t/p/w780${trendingMovies[0]?.backdrop_path || '/fallback.jpg'} 780w,
                https://image.tmdb.org/t/p/w1280${trendingMovies[0]?.backdrop_path || '/fallback.jpg'} 1280w
              `}
              sizes="100vw"
            />
            <img
              src={`https://image.tmdb.org/t/p/w1280${trendingMovies[0]?.backdrop_path || '/fallback.jpg'}`}
              alt={`${trendingMovies[0]?.title} - Now Trending`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
          </picture>

          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl">
              Watch Movies & TV Shows <span className="text-red-500">Free</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Stream HD content instantly. No signup. No ads.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/movies"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Movies
              </Link>
              <Link
                to="/tv-shows"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                TV Shows
              </Link>
            </div>
          </div>
        </section>

        {/* Trending Movies */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Trending Movies This Week</h2>
            <Link to="/movies" className="text-blue-400 hover:text-blue-300 transition-colors">
              View All →
            </Link>
          </div>
          <div className="relative">
            <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4">
              {trendingMovies.map((movie) => (
                <Link
                  key={movie.id}
                  to={`/movie/${slugify(movie.title)}-${movie.id}`}
                  className="flex-shrink-0 w-64 snap-center group"
                >
                  <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
                    <img
                      src={imageErrors[movie.id] || !movie.poster_path
                        ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                        : `https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                      alt={`${movie.title} poster`}
                      className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(movie.id)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-lg truncate group-hover:text-blue-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-sm text-gray-400">{movie.release_date?.split('-')[0] || 'N/A'}</p>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollCarousel('prev', carouselRef)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white z-10"
              aria-label="Previous"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollCarousel('next', carouselRef)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white z-10"
              aria-label="Next"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {/* Trending TV Shows */}
        <section className="py-16 px-4 max-w-7xl mx-auto bg-gray-800/30">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">Trending TV Shows</h2>
            <Link to="/tv-shows" className="text-blue-400 hover:text-blue-300 transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trendingTV.map((show) => (
              <Link
                key={show.id}
                to={`/tv-show/${slugify(show.name)}-${show.id}`}
                className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={imageErrors[show.id] || !show.poster_path
                    ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                    : `https://image.tmdb.org/t/p/w300${show.poster_path}`}
                  alt={`${show.name} poster`}
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => handleImageError(show.id)}
                  loading="lazy"
                />
                <div className="p-3 bg-gray-800">
                  <h3 className="font-semibold truncate group-hover:text-blue-400 transition-colors">
                    {show.name}
                  </h3>
                  <p className="text-xs text-gray-400">{show.first_air_date?.split('-')[0] || 'N/A'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Movies */}
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Latest Movies in Theaters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {latestMovies.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${slugify(movie.title)}-${movie.id}`}
                className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={imageErrors[movie.id] || !movie.poster_path
                    ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                    : `https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  alt={`${movie.title} poster`}
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => handleImageError(movie.id)}
                  loading="lazy"
                />
                <div className="p-3 bg-gray-800">
                  <h3 className="font-semibold truncate group-hover:text-blue-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-gray-400">{movie.release_date?.split('-')[0] || 'Soon'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <section className="bg-gradient-to-t from-black to-gray-900 py-16 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Start Watching Now – Free & HD
          </h3>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            No registration. No fees. Stream thousands of movies and TV shows instantly.
          </p>
          <Link
            to="/movies"
            className="inline-block bg-red-600 hover:bg-red-700 px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Browse All Movies
          </Link>
        </section>
      </div>
    </>
  );
};

export default HomePage;