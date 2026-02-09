import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useMetaTags } from '../useMetaTags';
import { slugify } from '../utils/slugify';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [featuredItem, setFeaturedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null); // For preloading backdrop image

  const fetchHomeContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const [movieData, tvData, genreData] = await Promise.all([
        axios.get(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=en-US`, { signal }),
        axios.get(`${BASE_URL}/trending/tv/day?api_key=${API_KEY}&language=en-US`, { signal }),
        axios.get(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`, { signal }),
      ]);

      setMovies(movieData.data.results.slice(0, 20));
      setTvShows(tvData.data.results.slice(0, 20));
      setGenres(genreData.data.genres);
      const allItems = [...movieData.data.results, ...tvData.data.results];
      setFeaturedItem(allItems[Math.floor(Math.random() * allItems.length)]);
    } catch (error) {
      if (!signal.aborted) {
        console.error('Error fetching home content:', error);
        setError('Failed to load content. Please try again later.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [API_KEY]);

  useEffect(() => {
    fetchHomeContent();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => {
      abortControllerRef.current?.abort();
      if (preloadLinkRef.current) {
        preloadLinkRef.current.remove();
        preloadLinkRef.current = null;
      }
    };
  }, [fetchHomeContent]);

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const handleExploreNow = () => {
    document.querySelector('.genres-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'GoMovies',
        url: 'https://gomovies.press/',
        description: 'Stream the latest movies and TV shows on GoMovies.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://gomovies.press/'
          }
        ]
      },
      {
        '@type': 'WebSite',
        name: 'GoMovies',
        url: 'https://gomovies.press/',
        description: 'Discover and stream the latest movies and TV shows on GoMovies. Enjoy a wide selection of genres and top-rated content.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://gomovies.press/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is GoMovies?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'GoMovies is a streaming platform offering a wide selection of movies and TV shows across various genres for online viewing.'
            }
          },
          {
            '@type': 'Question',
            name: 'How can I watch movies on GoMovies?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Browse the movies section, select a title, and click "Play Now" to start streaming instantly on GoMovies.'
            }
          },
          {
            '@type': 'Question',
            name: 'Are TV shows available on GoMovies?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, GoMovies offers a variety of TV shows, including popular series, which you can stream by selecting a show and season.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can I search for specific genres on GoMovies?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, GoMovies allows you to explore content by genre, making it easy to find movies and shows that match your interests.'
            }
          }
        ]
      }
    ]
  }), []);

  useMetaTags(
    'GoMovies - Stream Movies & TV Shows Online',
    'Discover and stream the latest movies and TV shows on GoMovies. Enjoy a wide selection of genres and top-rated content.',
    featuredItem?.poster_path ? `https://image.tmdb.org/t/p/w300${featuredItem.poster_path}` : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image',
    'website',
    schema
  );

  useEffect(() => {
    if (featuredItem && !preloadLinkRef.current) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = featuredItem?.backdrop_path 
        ? `https://image.tmdb.org/t/p/w1280${featuredItem.backdrop_path}` 
        : featuredItem?.poster_path 
        ? `https://image.tmdb.org/t/p/w1280${featuredItem.poster_path}` 
        : 'https://placehold.co/1200x400/000000/FFFFFF/png?text=No+Image';
      document.head.appendChild(preloadLink);
      preloadLinkRef.current = preloadLink;
      return () => {
        if (preloadLinkRef.current) {
          document.head.removeChild(preloadLinkRef.current);
          preloadLinkRef.current = null;
        }
      };
    }
  }, [featuredItem]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) return <div className="text-center py-8 text-red-500 text-xl">{error}</div>;

  const featuredBackdrop = featuredItem?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${featuredItem.backdrop_path}`
    : featuredItem?.poster_path
    ? `https://image.tmdb.org/t/p/w1280${featuredItem.poster_path}`
    : '/noimg.png';
  const featuredTitle = featuredItem?.title || featuredItem?.name || 'Featured Content';
  const featuredType = featuredItem?.title ? 'movie' : 'tv-show';
  const featuredId = featuredItem?.id ? `${slugify(featuredTitle)}-${featuredItem.id}` : '';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section with IMG */}
      <div className="relative min-h-[60vh] md:min-h-[50vh] lg:min-h-[60vh] max-h-[80vh] flex items-center justify-center overflow-hidden">
        <picture>
          <source
            srcSet={`
              ${featuredBackdrop.replace('/w1280/', '/w300/')} 300w,
              ${featuredBackdrop.replace('/w1280/', '/w300/')} 780w,
              ${featuredBackdrop} 1200w
            `}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px"
            type="image/jpeg"
          />
          <img
            src={featuredBackdrop}
            alt={`${featuredTitle} backdrop`}
            className="absolute inset-0 w-full h-full object-cover aspect-video md:aspect-auto"
            fetchPriority="high"
            decoding="async"
            loading="eager"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-gray-900"></div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <nav className="flex items-center text-sm text-gray-300 mb-4">
            <span className="text-gray-400">Home</span>
          </nav>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-2xl">{featuredTitle}</h1>
          <div className="flex items-center justify-center mb-6 space-x-4">
            <span className="text-3xl text-yellow-400">★</span>
            <span className="text-xl md:text-2xl">{(featuredItem?.vote_average || 0).toFixed(1)} / 10</span>
            <span className="text-gray-300">({featuredItem?.vote_count || 0} votes)</span>
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              to={`/${featuredType}/${featuredId}`}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-4 md:px-6 lg:px-8 py-2 md:py-3 rounded-full text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              aria-label={`Play ${featuredTitle}`}
            >
              ▶ Play Now
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Explore Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleExploreNow}
          className="bg-blue-600 hover:bg-blue-700 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
          aria-label="Scroll to genres"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-6 -mt-16 relative z-10">
        {/* Genres Section */}
        {genres.length > 0 && (
          <div className="mb-12 genres-section">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Explore Genres</h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {genres.slice(0, 12).map(genre => (
                <Link
                  key={genre.id}
                  to={`/genre/${slugify(genre.name)}-${genre.id}`}
                  className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full hover:bg-blue-600/40 hover:text-blue-200 transition-all duration-300 text-lg font-medium"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular Movies Section */}
        {movies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Popular Movies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {movies.map(movie => (
                <Link
                  key={movie.id}
                  to={`/movie/${slugify(movie.title)}-${movie.id}`}
                  className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                >
                  <picture>
                    <source
                      srcSet={`
                        ${movie.poster_path ? `https://image.tmdb.org/t/p/w154${movie.poster_path}` : 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image'} 200w,
                        ${movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://placehold.co/400x600/000000/FFFFFF/png?text=No+Image'} 400w,
                      `}
                      sizes="(max-width: 640px) 50vw, (max-width: 896px) 33.33vw, (max-width: 1280px) 25vw, 20vw"
                      type="image/webp"
                    />
                    <img
                      src={imageErrors[movie.id] || !movie.poster_path ? 'https://placehold.co/400x600/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                      alt={`${movie.title} poster`}
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(movie.id)}
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="p-4 bg-gray-800/50">
                    <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300">{movie.title}</h3>
                    <p className="text-gray-400 text-sm">{movie.release_date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Popular TV Shows Section */}
        {tvShows.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Popular TV Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tvShows.map(show => (
                <Link
                  key={show.id}
                  to={`/tv-show/${slugify(show.name)}-${show.id}`}
                  className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                >
                  <picture>
                    <source
                      srcSet={`
                        ${show.poster_path ? `https://image.tmdb.org/t/p/w154${show.poster_path}` : 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image'} 200w,
                        ${show.poster_path ? `https://image.tmdb.org/t/p/w300${show.poster_path}` : 'https://placehold.co/400x600/000000/FFFFFF/png?text=No+Image'} 400w
                      `}
                      sizes="(max-width: 640px) 50vw, (max-width: 896px) 33.33vw, (max-width: 1280px) 25vw, 20vw"
                      type="image/webp"
                    />
                    <img
                      src={imageErrors[show.id] || !show.poster_path ? 'https://placehold.co/400x600/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w154${show.poster_path}`}
                      alt={`${show.title} poster`}
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(show.id)}
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="p-4 bg-gray-800/50">
                    <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300">{show.name}</h3>
                    <p className="text-gray-400 text-sm">{show.first_air_date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;