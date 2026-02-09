import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const EpisodeDetail = () => {
  const { slugId, seasonNumber, episodeNumber } = useParams();
  const id = useMemo(() => slugId?.split('-').pop(), [slugId]);

  const [tv, setTv] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [cast, setCast] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [season, setSeason] = useState(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const carouselRef = useRef(null);
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

  const fetchEpisode = useCallback(async () => {
    if (!id || !seasonNumber || !episodeNumber) return;
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data } = await axios.get(
        `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,recommendations,reviews,season/${seasonNumber}/episode/${episodeNumber}`,
        { signal }
      );
      setTv(data);
      setEpisode(data[`season/${seasonNumber}/episode/${episodeNumber}`]);
      setCast(data.credits?.cast?.slice(0, 12) || []);
      setReviews(data.reviews?.results?.slice(0, 5) || []);
      setRecommendations(data.recommendations?.results?.slice(0, 10) || []);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('Episode not found or server error.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, seasonNumber, episodeNumber, API_KEY]);

  useEffect(() => {
    if (!id || !seasonNumber) return;
    const fetchSeason = async () => {
      try {
        const { data } = await axios.get(
          `${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`
        );
        setSeason(data);
      } catch (err) {
        console.error('Season fetch error:', err);
      }
    };
    fetchSeason();
  }, [id, seasonNumber, API_KEY]);

  useEffect(() => {
    fetchEpisode();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    return () => abortControllerRef.current?.abort();
  }, [fetchEpisode]);

  const handlePlayerLoad = () => setPlayerError(false);
  const handlePlayerError = () => setPlayerError(true);

  const handlePlayClick = () => {
    setIframeLoaded(true);
    setTimeout(() => document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const amount = 300;
      carouselRef.current.scrollBy({ left: dir === 'prev' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  // Schema.org - Rich Results for Episode
  const schema = useMemo(() => {
    const isoDate = formatISODate(episode?.air_date);

    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
            { "@type": "ListItem", "position": 2, "name": "TV Shows", "item": "https://gomovies.press/tv-shows" },
            { "@type": "ListItem", "position": 3, "name": tv?.name, "item": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}` },
            { "@type": "ListItem", "position": 4, "name": `Season ${seasonNumber}`, "item": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}` },
            { "@type": "ListItem", "position": 5, "name": `Episode ${episodeNumber}`, "item": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}/episode/${episodeNumber}` }
          ]
        },
        {
          "@type": "TVEpisode",
          "name": episode?.name,
          "url": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}/episode/${episodeNumber}`,
          "image": episode?.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : null,
          "description": episode?.overview,
          "datePublished": isoDate,
          "episodeNumber": episodeNumber,
          "partOfSeason": {
            "@type": "TVSeason",
            "seasonNumber": seasonNumber,
            "name": season?.name,
            "url": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}`
          },
          "partOfSeries": {
            "@type": "TVSeries",
            "name": tv?.name,
            "url": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}`
          },
          "aggregateRating": episode?.vote_average ? {
            "@type": "AggregateRating",
            "ratingValue": episode.vote_average.toFixed(1),
            "reviewCount": episode.vote_count
          } : undefined,
          "review": reviews.slice(0, 3).map(r => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": r.author },
            "datePublished": formatISODate(r.created_at),
            "reviewBody": r.content.substring(0, 500),
            "reviewRating": r.author_details?.rating ? {
              "@type": "Rating",
              "ratingValue": r.author_details.rating,
              "bestRating": 10
            } : undefined,
            "itemReviewed": {
              "@type": "TVEpisode",
              "name": episode?.name,
              "sameAs": `https://gomovies.press/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}/episode/${episodeNumber}`
            }
          }))
        },
        {
          "@type": "VideoObject",
          "name": `${tv?.name} S${seasonNumber}E${episodeNumber} - Watch Online Free`,
          "description": episode?.overview ? episode.overview : `Watch ${tv?.name} Season ${seasonNumber} Episode ${episodeNumber} online free in HD on GoMovies.`,
          "thumbnailUrl": episode?.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : null,
          "uploadDate": isoDate,
          "duration": formatDuration(episode?.runtime),
          "contentUrl": `https://vidsrc.net/embed/tv?tmdb=${id}&season=${seasonNumber}&episode=${episodeNumber}`,
          "embedUrl": `https://gomovies.press/embed/tv-show/${slugify(tv?.name)}-${id}/season/${seasonNumber}/episode/${episodeNumber}`,
          "publisher": { "@type": "Organization", "name": "GoMovies", "url": "https://gomovies.press" }
        }
      ]
    };
  }, [tv, episode, season, id, seasonNumber, episodeNumber, reviews]);

  // Preload Hero
  useEffect(() => {
    if (episode && !preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = episode.still_path
        ? `https://image.tmdb.org/t/p/w1280${episode.still_path}`
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
  }, [episode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error || !tv || !episode) {
    return (
      <div className="text-center py-20 text-red-400 text-2xl bg-gray-900 min-h-screen">
        {error || "Episode not found."}
      </div>
    );
  }

  const year = episode.air_date?.split('-')[0] || 'N/A';
  const backdrop = episode.still_path
    ? `https://image.tmdb.org/t/p/w1280${episode.still_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Backdrop`;

  const pageTitle = `Watch ${tv.name} Season ${seasonNumber} Episode ${episodeNumber} (${year}) Free Online in HD - GoMovies`;
  const metaDesc = `${episode.overview.substring(0, 155)}... Watch ${tv.name} S${seasonNumber}E${episodeNumber} free streaming on GoMovies. No signup.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${tv.name} season ${seasonNumber} episode ${episodeNumber}, watch ${tv.name} episode online free, ${tv.name} full episode`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={backdrop} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="video.episode" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/tv-show/${slugify(tv.name)}-${id}/season/${seasonNumber}/episode/${episodeNumber}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={backdrop.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={backdrop}
              alt={`${tv.name} S${seasonNumber}E${episodeNumber} backdrop`}
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
              <Link to={`/tv-show/${slugId}`} className="hover:text-blue-400">{tv.name}</Link>
              <span className="mx-2">›</span>
              <Link to={`/tv-show/${slugId}/season/${seasonNumber}`} className="hover:text-blue-400">Season {seasonNumber}</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">Episode {episodeNumber}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              {tv.name} <span className="text-red-500">S{seasonNumber}E{episodeNumber} ({year})</span>
            </h1>
            <div className="flex justify-center items-center gap-2 mb-4">
              <span className="text-yellow-400 text-2xl">★</span>
              <span className="text-xl font-bold">{episode.vote_average.toFixed(1)}</span>
              <span className="text-gray-400">/ 10</span>
            </div>
            <button
              onClick={handlePlayClick}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Play Episode
            </button>
          </div>
        </section>

        {/* Floating Play */}
        <button
          onClick={handlePlayClick}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Play episode"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1">
              <img
                src={imageErrors[episode.id] ? 'https://placehold.co/500x281/000000/FFFFFF/png?text=No+Image' : `https://image.tmdb.org/t/p/w500${episode.still_path}`}
                alt={`${tv.name} S${seasonNumber}E${episodeNumber} still`}
                className="w-full rounded-xl shadow-2xl ring-4 ring-red-600/30"
                onError={() => handleImageError(episode.id)}
                loading="lazy"
              />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overview</h2>
                <p className="text-gray-300 leading-relaxed">{episode.overview}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-400">Air Date:</span> {episode.air_date}</div>
                <div><span className="font-semibold text-gray-400">Runtime:</span> {episode.runtime} min</div>
                <div><span className="font-semibold text-gray-400">Rating:</span> {episode.vote_average.toFixed(1)} / 10</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tv.genres?.map(g => (
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

          {/* Player */}
          <section className="player-section mb-16">
            <h2 className="text-3xl font-bold text-center mb-6">Watch Episode {episodeNumber}</h2>
            {!iframeLoaded ? (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <p className="text-gray-400 mb-6">Click below to start streaming in HD</p>
                <button
                  onClick={handlePlayClick}
                  className="bg-red-600 hover:bg-red-700 px-12 py-4 rounded-full font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
                >
                  Play Episode
                </button>
              </div>
            ) : playerError ? (
              <div className="bg-red-900/50 border border-red-600 text-red-300 p-6 rounded-xl text-center">
                Player error. Try again or use mirror.
              </div>
            ) : (
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <iframe
                  src={`https://vidsrc.net/embed/tv?tmdb=${id}&season=${seasonNumber}&episode=${episodeNumber}`}
                  title={`${tv.name} S${seasonNumber}E${episodeNumber} stream`}
                  className="w-full h-full"
                  allowFullScreen
                  onLoad={handlePlayerLoad}
                  onError={handlePlayerError}
                  loading="lazy"
                />
              </div>
            )}
          </section>

          {/* Navigation */}
          {season && (
            <div className="flex justify-between mb-16">
              {parseInt(episodeNumber) > 1 && (
                <Link
                  to={`/tv-show/${slugId}/season/${seasonNumber}/episode/${parseInt(episodeNumber) - 1}`}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full font-bold transition"
                >
                  ← Previous Episode
                </Link>
              )}
              {parseInt(episodeNumber) < season.episodes.length && (
                <Link
                  to={`/tv-show/${slugId}/season/${seasonNumber}/episode/${parseInt(episodeNumber) + 1}`}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full font-bold transition"
                >
                  Next Episode →
                </Link>
              )}
            </div>
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
                <button onClick={() => scrollCarousel('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={() => scrollCarousel('next')} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </section>
          )}

          {/* Reviews – Clean HTML (No itemProp) */}
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

export default EpisodeDetail;