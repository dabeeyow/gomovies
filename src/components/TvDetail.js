import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const TvDetail = () => {
  const { slugId } = useParams();
  const idMatch = useMemo(() => slugId?.match(/^(\d+)-(.*)$/), [slugId]);
  const id = useMemo(() => idMatch?.[1] || slugId?.split('-').pop(), [idMatch, slugId]);

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
  const preloadLinkRef = useRef(null);

  const formatDuration = (minutes) => {
    if (!minutes) return 'PT45M';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `PT${h}H${m}M`;
  };

  const formatISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const fetchShow = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data } = await axios.get(
        `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,videos,recommendations,reviews,seasons`,
        { signal }
      );
      setTvShow(data);
      setCast(data.credits?.cast?.slice(0, 12) || []);
      setReviews(data.reviews?.results?.slice(0, 5) || []);
      setRecommendations(data.recommendations?.results?.slice(0, 10) || []);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('TV show not found or server error.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, API_KEY]);

  const trackView = useCallback(async () => {
    if (!id) return;
    try {
      const response = await axios.post('/api/track-view', { type: 'tv', id });
      setViews(response.data.views || 0);
    } catch (err) {
      console.error('Track view failed:', err);
    }
  }, [id]);

  const fetchViews = useCallback(async () => {
    if (!id) return;
    try {
      const response = await axios.get(`/api/get-views?type=tv&id=${id}`);
      setViews(response.data.views || 0);
    } catch (err) {
      setViews(0);
    }
  }, [id]);

  useEffect(() => {
    fetchShow();
    fetchViews();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => abortControllerRef.current?.abort();
  }, [fetchShow, fetchViews]);

  useEffect(() => {
    if (tvShow) trackView();
  }, [tvShow, trackView]);

  // Trailer Modal
  useEffect(() => {
    const escHandler = (e) => e.key === 'Escape' && trailerModal && !isClosing && closeTrailerModal();
    const clickOutside = (e) => modalRef.current && !modalRef.current.contains(e.target) && !isClosing && closeTrailerModal();
    if (trailerModal) {
      document.addEventListener('keydown', escHandler);
      document.addEventListener('mousedown', clickOutside);
    }
    return () => {
      document.removeEventListener('keydown', escHandler);
      document.removeEventListener('mousedown', clickOutside);
    };
  }, [trailerModal, isClosing]);

  const openTrailerModal = (key) => {
    setTrailerKey(key);
    setTrailerModal(true);
    setIsClosing(false);
  };

  const closeTrailerModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setTrailerModal(false);
      setTrailerKey(null);
      setIsClosing(false);
    }, 250);
  };

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const amount = 300;
      carouselRef.current.scrollBy({ left: dir === 'prev' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  // Schema.org - Rich Results for TV
  const schema = useMemo(() => {
    const isoDate = formatISODate(tvShow?.first_air_date);

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
            { "@type": "ListItem", "position": 2, "name": "TV Shows", "item": "https://gomovies.press/tv-shows" },
            { "@type": "ListItem", "position": 3, "name": tvShow?.name, "item": `https://gomovies.press/tv-show/${slugify(tvShow?.name)}-${id}` }
          ]
        },
        {
          "@type": "TVSeries",
          "name": tvShow?.name,
          "url": `https://gomovies.press/tv-show/${slugify(tvShow?.name)}-${id}`,
          "image": tvShow?.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : null,
          "description": tvShow?.overview,
          "datePublished": isoDate,
          "numberOfSeasons": tvShow?.number_of_seasons,
          "numberOfEpisodes": tvShow?.number_of_episodes,
          "genre": tvShow?.genres?.map(g => g.name),
          "creator": tvShow?.created_by?.map(c => ({
            "@type": "Person", "name": c.name
          })),
          "actor": tvShow?.credits?.cast?.slice(0, 6).map(a => ({
            "@type": "Person", "name": a.name
          })),
          "aggregateRating": tvShow?.vote_average ? {
            "@type": "AggregateRating",
            "ratingValue": tvShow.vote_average.toFixed(1) / 2,
            "reviewCount": tvShow.vote_count
          } : undefined,
          "review": reviews.slice(0, 3).map(r => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": r.author },
            "datePublished": formatISODate(r.created_at),
            "reviewBody": r.content.substring(0, 500),
            "reviewRating": r.author_details?.rating ? {
              "@type": "Rating",
              "ratingValue": r.author_details.rating / 2,
              "bestRating": 5
            } : undefined,
            "itemReviewed": {
              "@type": "TVSeries",
              "name": tvShow?.name,
              "sameAs": `https://gomovies.press/tv-show/${slugify(tvShow?.name)}-${id}`
            }
          }))
        },
        {
          "@type": "VideoObject",
          "name": `${tvShow?.name} - Watch Online Free`,
          "description": tvShow?.overview,
          "thumbnailUrl": tvShow?.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : null,
          "uploadDate": isoDate,
          "duration": formatDuration(tvShow?.episode_run_time?.[0]),
          "contentUrl": `https://gomovies.press/stream/tv/${id}`,
          "embedUrl": `https://gomovies.press/embed/tv/${id}`,
          "publisher": { "@type": "Organization", "name": "GoMovies", "url": "https://gomovies.press" }
        }
      ]
    };
  }, [tvShow, id, reviews]);

  // Preload Hero
  useEffect(() => {
    if (tvShow && !preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = tvShow.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
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
  }, [tvShow]);

  // Redirect old slug
  if (idMatch) {
    const [, showId, title] = idMatch;
    return <Navigate to={`/tv-show/${slugify(title)}-${showId}`} replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="text-center py-20 text-red-400 text-2xl bg-gray-900 min-h-screen">
        {error || "TV show not found."}
      </div>
    );
  }

  const year = tvShow.first_air_date?.split('-')[0] || 'N/A';
  const backdrop = tvShow.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;
  const poster = tvShow.poster_path
    ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}`
    : 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Poster';
  const trailer = tvShow.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  const pageTitle = `Watch ${tvShow.name} (${year}) Full TV Show Free Online in HD - GoMovies`;
  const metaDesc = `${tvShow.overview.substring(0, 155)}... Watch ${tvShow.name} free streaming on GoMovies. No signup.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${tvShow.name}, watch ${tvShow.name} online free, ${tvShow.name} full episodes, ${tvShow.genres?.map(g => g.name).join(', ')}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={poster} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="video.tv_show" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/tv-show/${slugify(tvShow.name)}-${id}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={backdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={backdrop}
              alt={`${tvShow.name} backdrop`}
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
              <Link to="/tv-shows" className="hover:text-blue-400">TV Shows</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{tvShow.name}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              {tvShow.name} <span className="text-red-500">({year})</span>
            </h1>
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-yellow-400 text-2xl">★</span>
              <span className="text-xl font-bold">{tvShow.vote_average.toFixed(1)}</span>
              <span className="text-gray-400">/ 10</span>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                to={`/tv-show/${slugId}/season/${tvShow.number_of_seasons}`}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Watch Season {tvShow.number_of_seasons}
              </Link>
              {trailer && (
                <button
                  onClick={() => openTrailerModal(trailer.key)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Trailer
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Floating Watch */}
        <Link
          to={`/tv-show/${slugId}/season/${tvShow.number_of_seasons}`}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Watch TV show"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </Link>

        {/* Trailer Modal */}
        {trailerModal && (
          <div className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 transition-opacity ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div ref={modalRef} className={`relative w-full max-w-4xl p-6 transition-transform ${isClosing ? 'scale-95' : 'scale-100'}`}>
              <button onClick={closeTrailerModal} className="absolute -top-12 right-0 text-white hover:text-red-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                  title="Trailer"
                  className="w-full h-full"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <img
                src={imageErrors[tvShow.id] ? 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Poster' : poster}
                alt={`${tvShow.name} poster`}
                className="w-full rounded-xl shadow-2xl ring-4 ring-red-600/30"
                onError={() => handleImageError(tvShow.id)}
                loading="lazy"
              />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{tvShow.overview}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-400">First Air:</span> {tvShow.first_air_date}</div>
                <div><span className="font-semibold text-gray-400">Seasons:</span> {tvShow.number_of_seasons}</div>
                <div><span className="font-semibold text-gray-400">Episodes:</span> {tvShow.number_of_episodes}</div>
                <div><span className="font-semibold text-gray-400">Views:</span> {views.toLocaleString()}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tvShow.genres?.map(g => (
                  <Link
                    key={g.id}
                    to={`/genre/${slugify(g.name)}-${g.id}`}
                    className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full hover:bg-blue-600/40 transition"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Seasons */}
          {tvShow.seasons?.length > 0 && (
            <section className="mb-16 seasons-section">
              <h2 className="text-3xl font-bold text-center mb-6">Seasons</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {tvShow.seasons.map(season => (
                  <Link
                    key={season.id}
                    to={`/tv-show/${slugId}/season/${season.season_number}`}
                    className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition"
                  >
                    <img
                      src={imageErrors[season.id] ? 'https://placehold.co/500x281/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${season.poster_path || tvShow.poster_path}`}
                      alt={`${season.name} poster`}
                      className="w-full h-64 object-cover group-hover:scale-105 transition"
                      onError={() => handleImageError(season.id)}
                      loading="lazy"
                    />
                    <div className="p-3 bg-gray-800">
                      <h3 className="font-semibold truncate group-hover:text-blue-400">{season.name}</h3>
                      <p className="text-xs text-gray-400">Episodes: {season.episode_count}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-6">Cast</h2>
              <div className="relative">
                <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide py-4">
                  {cast.map(actor => (
                    <Link
                      key={actor.id}
                      to={`/person/${slugify(actor.name)}-${actor.id}`}
                      className="flex-shrink-0 w-44 text-center group"
                    >
                      <img
                        src={imageErrors[actor.id] ? 'https://placehold.co/200x300/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${actor.profile_path}`}
                        alt={actor.name}
                        className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:scale-105 transition"
                        onError={() => handleImageError(actor.id)}
                        loading="lazy"
                      />
                      <p className="mt-2 font-semibold group-hover:text-blue-400">{actor.name}</p>
                      <p className="text-sm text-gray-400">{actor.character}</p>
                    </Link>
                  ))}
                </div>
                <button onClick={() => scrollCarousel('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full" aria-label="Scroll left">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => scrollCarousel('next')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full" aria-label="Scroll right">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-6">User Reviews</h2>
              <div className="space-y-6 max-w-4xl mx-auto">
                {reviews.map((review, index) => {
                  const rating = review.author_details?.rating;
                  const stars = rating ? Math.round(rating / 2) : 0;
                  const avatarPath = review.author_details?.avatar_path;
                  const avatarUrl = avatarPath
                    ? (avatarPath.startsWith('/https')
                        ? avatarPath.slice(1)
                        : `https://image.tmdb.org/t/p/w200${avatarPath}`)
                    : null;

                  return (
                    <div
                      key={index}
                      className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={`${review.author}'s avatar`}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-600"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/100x100/333333/FFFFFF/png?text=${review.author[0].toUpperCase()}`;
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-600">
                              {review.author[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {review.author}
                            </h3>
                            {rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-5 h-5 ${i < stars ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3 .921-.755 1.688-1.54 1.118l-3.39-2.46a1 1 0 00-1.175 0l-3.39 2.46c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.27 8.397c-.783-.57-.381-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm text-gray-400">
                                  {rating}/10
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            Reviewed on {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-gray-200 leading-relaxed">
                            {review.content.length > 300 ? (
                              <>
                                {review.content.substring(0, 300)}...
                                <button
                                  onClick={() => {
                                    const el = document.getElementById(`full-review-${index}`);
                                    if (el) el.style.display = 'block';
                                    const btn = document.getElementById(`read-more-${index}`);
                                    if (btn) btn.style.display = 'none';
                                  }}
                                  id={`read-more-${index}`}
                                  className="text-blue-400 hover:text-blue-300 ml-1 font-medium"
                                >
                                  Read more
                                </button>
                                <span id={`full-review-${index}`} style={{ display: 'none' }}>
                                  {' '}{review.content.substring(300)}
                                </span>
                              </>
                            ) : (
                              review.content
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-center mb-6">Similar TV Shows</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recommendations.map(rec => (
                  <Link
                    key={rec.id}
                    to={`/tv-show/${slugify(rec.name)}-${rec.id}`}
                    className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition"
                  >
                    <img
                      src={imageErrors[rec.id] ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w300${rec.poster_path}`}
                      alt={rec.name}
                      className="w-full h-72 object-cover group-hover:scale-105 transition"
                      onError={() => handleImageError(rec.id)}
                      loading="lazy"
                    />
                    <div className="p-3 bg-gray-800">
                      <h3 className="font-semibold truncate group-hover:text-blue-400">{rec.name}</h3>
                      <p className="text-xs text-gray-400">{rec.first_air_date?.split('-')[0]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default TvDetail;