import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const MovieDetail = () => {
  const { slugId } = useParams();
  const idMatch = useMemo(() => slugId ? slugId.match(/^(\d+)-(.+)$/) : null, [slugId]);
  const id = useMemo(() => idMatch ? idMatch[1] : (slugId ? slugId.split('-').pop() : null), [idMatch, slugId]);

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerError, setPlayerError] = useState(false);
  const [error, setError] = useState(null);
  const [trailerModal, setTrailerModal] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [views, setViews] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false); // New: controls iframe rendering

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const carouselRef = useRef(null);
  const modalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null);

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'PT2H';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `PT${hours}H${remainingMinutes}M`;
  };

  const fetchMovie = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data } = await axios.get(
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,images,videos,recommendations,reviews`,
        { signal }
      );
      setMovie(data);
      setCast(data.credits?.cast?.slice(0, 10) || []);
      setReviews(data.reviews?.results?.slice(0, 5) || []);
      setRecommendations(data.recommendations?.results?.slice(0, 10) || []);
    } catch (error) {
      if (!signal.aborted) {
        console.error('Error fetching movie details:', error);
        setError('Failed to load movie details. Please try again later.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, API_KEY]);

  const trackView = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axios.post('/api/track-view', { type: 'movie', id });
      setViews(data.views || 0);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [id]);

  const fetchViews = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axios.get(`/api/get-views?type=movie&id=${id}`);
      setViews(data.views || 0);
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews(0);
    }
  }, [id]);

  useEffect(() => {
    fetchMovie();
    fetchViews();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => abortControllerRef.current?.abort();
  }, [fetchMovie, fetchViews]);

  useEffect(() => {
    if (movie) trackView();
  }, [movie, trackView]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && trailerModal && !isClosing) closeTrailerModal();
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && !isClosing) closeTrailerModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [trailerModal, isClosing]);

  const handlePlayerLoad = () => setPlayerError(false);
  const handlePlayerError = () => setPlayerError(true);

  // const handlePlayNow = () => {
  //   document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth' });
  // };

  const openTrailerModal = (key) => {
    setTrailerKey(key);
    setIsClosing(false);
    setTrailerModal(true);
  };

  const closeTrailerModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setTrailerModal(false);
      setTrailerKey(null);
      setIsClosing(false);
    }, 250);
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === 'prev' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://gomovies.press/' },
          { '@type': 'ListItem', position: 2, name: 'Movies', item: 'https://gomovies.press/movies' },
          {
            '@type': 'ListItem',
            position: 3,
            name: movie?.title || 'Movie',
            item: movie ? `https://gomovies.press/movie/${slugify(movie.title)}-${id}` : ''
          }
        ]
      },
      {
        '@type': 'Movie',
        director: movie?.credits?.crew?.filter(c => c.job === 'Director').map(d => ({
          '@type': 'Person',
          name: d.name,
          url: `https://gomovies.press/person/${slugify(d.name)}-${d.id}`
        })),
        actor: movie?.credits?.cast?.slice(0, 5).map(a => ({
          '@type': 'Person',
          name: a.name,
          url: `https://gomovies.press/person/${slugify(a.name)}-${a.id}`
        })) || [],
        name: movie?.title || 'Movie',
        description: movie?.overview || `Watch ${movie?.title || 'movie'} online on GoMovies`,
        url: movie ? `https://gomovies.press/movie/${slugify(movie.title)}-${id}` : '',
        image: movie?.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
        genre: movie?.genres?.map(g => g.name) || [],
        keywords: movie?.genres?.map(g => g.name).join(', ') || '',
        datePublished: movie?.release_date,
        duration: formatDuration(movie?.runtime),
        aggregateRating: movie?.vote_average && movie?.vote_count > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average.toFixed(1),
          ratingCount: movie.vote_count,
          bestRating: '10',
          worstRating: '0'
        } : undefined,
        review: reviews?.slice(0, 3).map(r => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: r.author },
          reviewRating: r.author_details.rating ? {
            '@type': 'Rating',
            ratingValue: (r.author_details.rating / 2).toFixed(1),
            bestRating: '5',
            worstRating: '0'
          } : undefined,
          reviewBody: r.content.substring(0, 300) + '...',
          datePublished: new Date(r.created_at).toISOString()
        })) || []
      },
      {
        '@type': 'VideoObject',
        name: movie?.title || 'Movie',
        description: movie?.overview || `Watch ${movie?.title || 'movie'} on GoMovies.`,
        thumbnailUrl: movie?.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image',
        uploadDate: movie?.release_date ? new Date(movie.release_date).toISOString() : new Date().toISOString(),
        duration: formatDuration(movie?.runtime),
        contentUrl: `https://gomovies.press/videos/movie.mp4`,
        embedUrl: `https://gomovies.press/embed/movie/${slugify(movie?.title || 'movie')}-${id}`,
        publisher: {
          '@type': 'Organization',
          name: 'GoMovies',
          url: 'https://gomovies.press'
        }
      }
    ]
  }), [movie, id, reviews]);

  useEffect(() => {
    if (schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }
  }, [schema]);

  const getFullYear = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  useEffect(() => {
    if (movie && !preloadLinkRef.current) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : movie.poster_path
        ? `https://image.tmdb.org/t/p/w1280${movie.poster_path}`
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
  }, [movie]);

  // Redirect old URL format
  if (idMatch) {
    const [, movieId, title] = idMatch;
    return <Navigate to={`/movie/${slugify(title)}-${movieId}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) return <div className="text-center py-8 text-red-500 text-xl">{error}</div>;
  if (!movie) return <div className="text-center py-8 text-gray-400 text-xl">Movie not found.</div>;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : `https://image.tmdb.org/t/p/w1280${movie.poster_path}`;
  const trailer = movie.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
  const movieTitle = movie.title || 'Movie';

  const metaTitle = movie?.title
    ? `${movie.title} (${getFullYear(movie.release_date)}) - Watch Online on GoMovies | GoMovies`
    : 'Loading Movie... | GoMovies';
  const metaDescription = movie?.overview
    ? `${movie.overview.substring(0, 157)}${movie.overview.length > 157 ? '...' : ''}`
    : 'Loading movie details on GoMovies...';
  const metaImage = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
    : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image';

  // New: Handle Play button click to load iframe
  const handlePlayClick = () => {
    setIframeLoaded(true);
    setTimeout(() => {
      document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:type" content="video.movie" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="relative min-h-[60vh] md:min-h-[50vh] lg:min-h-[60vh] max-h-[80vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source
              srcSet={`
                ${backdropUrl.replace('/w1280/', '/w300/')} 300w,
                ${backdropUrl.replace('/w1280/', '/w780/')} 780w,
                ${backdropUrl} 1200w
              `}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px"
              type="image/jpeg"
            />
            <img
              src={backdropUrl}
              alt={`${movieTitle} backdrop`}
              className="absolute inset-0 w-full h-full object-cover aspect-video md:aspect-auto"
              fetchPriority="high"
              decoding="async"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-gray-900"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex items-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-blue-400 transition-colors duration-300">Home</Link>
              <span className="mx-2">›</span>
              <Link to="/movies" className="hover:text-blue-400 transition-colors duration-300">Movies</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{movie.title}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl">{movie.title}</h1>
            <div className="flex items-center justify-center mb-6 space-x-4">
              <span className="text-3xl text-yellow-400">★</span>
              <span className="text-xl md:text-2xl">{movie.vote_average.toFixed(1)} / 10</span>
              <span className="text-gray-300">({movie.vote_count} votes)</span>
            </div>
            <div className="flex gap-4 justify-center">
              {/* Modified: Play button now triggers iframe load */}
              <button
                onClick={handlePlayClick}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                aria-label="Play movie"
              >
                ▶ Play
              </button>
              {trailer ? (
                <button
                  onClick={() => openTrailerModal(trailer.key)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  aria-label="Watch trailer"
                >
                  🎬 Trailer
                </button>
              ) : (
                <span className="px-8 py-3 text-gray-400 text-lg">No trailer available</span>
              )}
            </div>
          </div>
        </div>

        {/* Floating Play Button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handlePlayClick}
            className="bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Play movie"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        {/* Trailer Modal */}
        {trailerModal && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            role="dialog"
            aria-labelledby="trailer-modal-title"
            aria-modal="true"
          >
            <div
              ref={modalRef}
              className={`relative w-full max-w-4xl bg-gray-800 rounded-2xl p-6 shadow-2xl transition-transform duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}
            >
              <button
                onClick={closeTrailerModal}
                className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 rounded-full p-2 text-white transition-colors duration-200"
                aria-label="Close trailer modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 id="trailer-modal-title" className="text-2xl font-semibold text-white mb-4 text-center">
                {movie.title} Trailer
              </h2>
              {trailerKey ? (
                <div className="relative w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0`}
                    title={`${movie.title} Trailer`}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400">No trailer available</div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-6 -mt-16 relative z-10">
          <div className="bg-gray-800/90 rounded-2xl shadow-2xl p-4 md:p-8 mb-8 border border-gray-700/30">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <img
                src={imageErrors[movie.id] || !movie.poster_path
                  ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                  : `https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={`${movie.title} poster`}
                className="md:w-72 h-auto rounded-xl shadow-xl ring-2 ring-blue-500/20 hover:ring-blue-500/50 transition-all duration-300"
                onError={() => handleImageError(movie.id)}
                loading="lazy"
              />
              <div className="flex-1">
                <p className="text-gray-400 mb-4">Release Date: {movie.release_date}</p>
                <p className="text-gray-200 text-lg leading-relaxed mb-6">{movie.overview}</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {movie.genres?.slice(0, 3).map(genre => (
                    <Link
                      key={genre.id}
                      to={`/genre/${slugify(genre.name)}-${genre.id}`}
                      className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full hover:bg-blue-600/40 hover:text-blue-200 transition-all duration-300"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center text-gray-400 mt-4">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-lg font-medium">{views} views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Player Section - iframe only renders after Play click */}
          <div id="player-section" className="text-center mb-12 player-section">
            <h2 className="text-3xl font-bold text-white mb-6">Watch Movie</h2>
            {playerError ? (
              <div className="bg-red-600/20 text-red-300 p-4 rounded-md border border-red-500/50">
                Player unavailable. Please try again later or use another source.
              </div>
            ) : !iframeLoaded ? (
              <div className="bg-gray-800 rounded-2xl p-12 max-w-5xl mx-auto">
                <p className="text-gray-400 mb-6">Click the Play button to start watching.</p>
                <button
                  onClick={handlePlayClick}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  ▶ Play Now
                </button>
              </div>
            ) : (
              <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl ring-2 ring-blue-500/20">
                <iframe
                  src={`https://vidsrc.net/embed/movie?tmdb=${id}`}
                  title={`${movie.title} Player`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  onLoad={handlePlayerLoad}
                  onError={handlePlayerError}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Rest of the content (cast, reviews, recommendations) */}
          {cast.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Top Cast</h2>
              <div className="relative overflow-hidden rounded-2xl bg-gray-800/50 border border-gray-700/30">
                <div ref={carouselRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide py-4 gap-6 px-4">
                  {cast.map((actor) => (
                    <Link
                      key={actor.id}
                      to={`/person/${slugify(actor.name)}-${actor.id}`}
                      className="flex-shrink-0 w-48 snap-center text-center group"
                    >
                      <img
                        src={imageErrors[actor.id] || !actor.profile_path
                          ? 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image'
                          : `https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                        alt={`${actor.name} profile`}
                        className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500/50 transition-all duration-300"
                        onError={() => handleImageError(actor.id)}
                        loading="lazy"
                      />
                      <h3 className="font-semibold text-white mt-2 group-hover:text-blue-400 transition-colors duration-300">{actor.name}</h3>
                      <p className="text-gray-400 text-sm">{actor.character}</p>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => scrollCarousel('prev')}
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10 bg-blue-600/50 hover:bg-blue-600/70 p-3 rounded-full text-white transition-all duration-300"
                  aria-label="Previous cast"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollCarousel('next')}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10 bg-blue-600/50 hover:bg-blue-600/70 p-3 rounded-full text-white transition-all duration-300"
                  aria-label="Next cast"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {reviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Movie Reviews</h2>            
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(review.author_details.avatar_path && review.author_details.avatar_path.startsWith('/https') ? (
                            <img className="w-12 h-12 rounded-full object-cover" src={review.author_details.avatar_path.slice(1)} alt={review.author} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/000000/FFFFFF/png?text=No+Image'; }} />
                          ) : 
                            review.author_details.avatar_path ? (
                              <img className="w-12 h-12 rounded-full object-cover" src={`https://image.tmdb.org/t/p/w200${review.author_details.avatar_path}`} alt={review.author} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/000000/FFFFFF/png?text=No+Image'; }} />
                            ) : (
                              <span>{review.author.substring(0, 1).toUpperCase()}</span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">{review.author}</h3>
                        <p className="text-gray-400 text-sm mb-3">Reviewed on {new Date(review.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < Math.round((review.author_details.rating || 0) / 2) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3 .921-.755 1.688-1.54 1.118l-3.39-2.46a1 1 0 00-1.175 0l-3.39 2.46c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.27 8.397c-.783-.57-.381-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-200 leading-relaxed italic">{review.content.substring(0, 300)}...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>            
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Recommended Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/movie/${slugify(rec.title)}-${rec.id}`}
                    className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                  >
                    <img
                      src={imageErrors[rec.id] || !rec.poster_path ? 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${rec.poster_path}`}
                      alt={`${rec.title} poster`}
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(rec.id)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="p-4 bg-gray-800/50">
                      <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300">{rec.title}</h3>
                      <p className="text-gray-400 text-sm">{rec.release_date}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MovieDetail;