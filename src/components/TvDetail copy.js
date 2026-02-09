import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const TvDetail = () => {
  const { slugId } = useParams();
  // const id = useMemo(() => slugId ? slugId.split('-').pop() : null, [slugId]);
  const idMatch = useMemo(() => slugId ? slugId.match(/^(\d+)-(.+)$/) : null, [slugId]);
  const id = useMemo(() => idMatch ? idMatch[1] : (slugId ? slugId.split('-').pop() : null), [idMatch, slugId]);
  const [tvShow, setTvShow] = useState(null);
  const [cast, setCast] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailerModal, setTrailerModal] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [views, setViews] = useState(0);
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const carouselRef = useRef(null);
  const modalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null); // Added for preloading backdrop image

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'PT45M'; // Fallback: 45 minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `PT${hours}H${remainingMinutes}M`;
  };

  const fetchShow = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const data = await axios.get(
        `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,images,videos,recommendations,reviews`,
        { signal }
      );
      setTvShow(data.data);
      setCast(data.data.credits?.cast?.slice(0, 10) || []);
      setReviews(data.data.reviews?.results?.slice(0, 5) || []);
      setRecommendations(data.data.recommendations?.results?.slice(0, 10) || []);
    } catch (error) {
      if (!signal.aborted) {
        console.error('Error fetching TV show details:', error);
        setError('Failed to load TV show details. Please try again later.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [id, API_KEY]);

  const trackView = useCallback(async () => {
    if (!id) return;
    try {
      const response = await axios.post('/api/track-view', { type: 'tv', id });
      setViews(response.data.views || 0);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, [id]);

  const fetchViews = useCallback(async () => {
    if (!id) return;
    try {
      const response = await axios.get(`/api/get-views?type=tv&id=${id}`);
      setViews(response.data.views || 0);
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews(0);
    }
  }, [id]);

  useEffect(() => {
    fetchShow();
    fetchViews();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchShow, fetchViews]);

  useEffect(() => {
    if (tvShow) {
      trackView();
    }
  }, [tvShow, trackView]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && trailerModal && !isClosing) {
        closeTrailerModal();
      }
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && !isClosing) {
        closeTrailerModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [trailerModal, isClosing]);

  const handlePlayNow = () => {
    document.querySelector('.seasons-section')?.scrollIntoView({ behavior: 'smooth' });
  };

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
          { '@type': 'ListItem', position: 2, name: 'TV Shows', item: 'https://gomovies.press/tv-shows' },
          {
            '@type': 'ListItem',
            position: 3,
            name: tvShow?.name || 'TV Show',
            item: tvShow ? `https://gomovies.press/tv-show/${slugify(tvShow.name)}-${id}` : ''
          }
        ]
      },
      {
        '@type': 'TVSeries',
        creator: tvShow?.created_by?.map(c => ({
          '@type': 'Person',
          name: c.name,
          url: `https://gomovies.press/person/${slugify(c.name)}-${c.id}`
        })) || [],
        actor: tvShow?.credits?.cast?.slice(0, 5).map(a => ({
          '@type': 'Person',
          name: a.name,
          url: `https://gomovies.press/person/${slugify(a.name)}-${a.id}`
        })) || [],
        name: tvShow?.name || 'TV Show',
        description: tvShow?.overview || `Watch ${tvShow?.name || 'TV show'} online on GoMovies`,
        url: tvShow ? `https://gomovies.press/tv-show/${slugify(tvShow.name)}-${id}` : '',
        image: tvShow?.poster_path ? `https://image.tmdb.org/t/p/w300${tvShow.poster_path}` : null,
        genre: tvShow?.genres?.map(g => g.name) || [],
        keywords: tvShow?.genres?.map(g => g.name).join(', ') || '',
        datePublished: tvShow?.first_air_date,
        numberOfSeasons: tvShow?.number_of_seasons || undefined,
        numberOfEpisodes: tvShow?.number_of_episodes || undefined,
        aggregateRating: tvShow?.vote_average && tvShow?.vote_count > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: tvShow.vote_average.toFixed(1),
          ratingCount: tvShow.vote_count,
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
        name: tvShow?.name || 'TV Show',
        description: tvShow?.overview || `Watch ${tvShow?.name || 'TV show'} on GoMovies.`,
        thumbnailUrl: tvShow?.poster_path ? `https://image.tmdb.org/t/p/w300${tvShow.poster_path}` : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image',
        uploadDate: tvShow?.first_air_date ? new Date(tvShow.first_air_date).toISOString() : new Date().toISOString(),
        duration: formatDuration(tvShow?.episode_run_time?.[0] || 45),
        contentUrl: `https://gomovies.press/videos/tv.mp4`,
        embedUrl: `https://gomovies.press/embed/tv-show/${slugify(tvShow?.name || 'tv-show')}-${id}`,
        publisher: {
          '@type': 'Organization',
          name: 'GoMovies',
          url: 'https://gomovies.press'
        }
      }
    ]
  }), [tvShow, id, reviews]);

  if (schema) {
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);
  }

  const getFullYear = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  useEffect(() => {
    if (tvShow && !preloadLinkRef.current) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : tvShow.poster_path ? `https://image.tmdb.org/t/p/original${tvShow.poster_path}` : 'https://placehold.co/1200x400/000000/FFFFFF/png?text=No+Image';
      document.head.appendChild(preloadLink);
      preloadLinkRef.current = preloadLink;
      return () => {
        if (preloadLinkRef.current) {
          document.head.removeChild(preloadLinkRef.current);
          preloadLinkRef.current = null;
        }
      };
    }
  }, [tvShow]);

  // Redirect old URL format (id-title) to new format (title-id)
  if (idMatch) {
    const [, showId, title] = idMatch;
    return <Navigate to={`/tv-show/${slugify(title)}-${showId}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) return <div className="text-center py-8 text-red-500 text-xl">{error}</div>;
  if (!tvShow) return <div className="text-center py-8 text-gray-400 text-xl">TV show not found.</div>;

  const backdropUrl = tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}` : `https://image.tmdb.org/t/p/original${tvShow.poster_path}`;
  const trailer = tvShow.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
  const tvShowTitle = tvShow.name || 'TV Show';

  const metaTitle = tvShow?.name 
    ? `${tvShow.name} (${getFullYear(tvShow.first_air_date)}) - Watch Online on GoMovies | GoMovies` 
    : 'Loading TV show... | GoMovies';
  const metaDescription = tvShow?.overview 
    ? `${tvShow.overview.substring(0, 157)}${tvShow.overview.length > 157 ? '...' : ''}` 
    : 'Loading TV show details on GoMovies...';
  const metaImage = tvShow?.poster_path 
    ? `https://image.tmdb.org/t/p/w300${tvShow.poster_path}` 
    : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image';

  return (
    <>    
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={metaImage} />
        <meta property="og:type" content="video.series" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section with Parallax */}
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
              alt={`${tvShowTitle} backdrop`}
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
              <Link to="/tv-shows" className="hover:text-blue-400 transition-colors duration-300">TV Shows</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{tvShow.name}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl">{tvShow.name}</h1>
            <div className="flex items-center justify-center mb-6 space-x-4">
              <span className="text-3xl text-yellow-400">★</span>
              <span className="text-xl md:text-2xl">{tvShow.vote_average.toFixed(1)} / 10</span>
              <span className="text-gray-300">({tvShow.vote_count} votes)</span>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePlayNow}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                aria-label="Scroll to player"
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

        {/* Sticky Play Now Button */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handlePlayNow}
            className="bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            aria-label="Scroll to player"
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
                {tvShow.name} Trailer
              </h2>
              {trailerKey ? (
                <div className="relative w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=0`}
                    title={`${tvShow.name} Trailer`}
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
                src={imageErrors[tvShow.id] || !tvShow.poster_path ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`}
                alt={`${tvShow.name} poster`}
                className="md:w-72 h-auto rounded-xl shadow-xl ring-2 ring-blue-500/20 hover:ring-blue-500/50 transition-all duration-300"
                onError={() => handleImageError(tvShow.id)}
                loading="lazy"
              />
              <div className="flex-1">
                <p className="text-gray-400 mb-4">First Air Date: {tvShow.first_air_date}</p>
                <p className="text-gray-200 text-lg leading-relaxed mb-6">{tvShow.overview}</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {tvShow.genres?.slice(0, 3).map(genre => (
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

          {/* Seasons Section */}
          {tvShow.seasons && tvShow.seasons.length > 0 && (
            <div id="seasons-section" className="mb-12 seasons-section">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Seasons</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tvShow.seasons.map(season => (
                  <Link
                    key={season.id}
                    to={`/tv-show/${slugId}/season/${season.season_number}`}
                    className="group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative"
                  >
                    <img
                      src={season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : imageErrors[season.id] || !tvShow.poster_path ? 'https://placehold.co/500x281/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${tvShow.poster_path}`}
                      alt={`${tvShow.name} ${season.name} poster`}
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => handleImageError(season.id)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="p-4 bg-gray-800/50">
                      <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300">{season.name}</h3>
                      <p className="text-gray-400 text-sm">Episodes: {season.episode_count}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cast Carousel */}
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
                        src={imageErrors[actor.id] || !actor.profile_path ? 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${actor.profile_path}`}
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

          {/* Reviews Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">TV Show Reviews</h2>
            {reviews.length > 0 ? (
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
            ) : (
              <div className="text-center text-gray-400 text-lg">No reviews available.</div>
            )}
          </div>

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Recommended TV Shows</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/tv-show/${slugify(rec.name)}-${rec.id}`}
                    className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 relative"
                  >
                    <img
                      src={imageErrors[rec.id] || !rec.poster_path ? 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${rec.poster_path}`}
                      alt={`${rec.name} poster`}
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
                      <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-300">{rec.name}</h3>
                      <p className="text-gray-400 text-sm">{rec.first_air_date}</p>
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

export default TvDetail;