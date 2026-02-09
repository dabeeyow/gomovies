import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { slugify } from '../utils/slugify';

const CastDetail = () => {
  const { slugId } = useParams();
  const id = useMemo(() => slugId?.split('-').filter(part => part).pop(), [slugId]);

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [activeTab, setActiveTab] = useState('filmography'); // Tabs: bio, filmography

  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const abortControllerRef = useRef(null);
  const preloadLinkRef = useRef(null);

  const formatISODate = (dateString) => {
    if (!dateString) return new Date().toISOString();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

  const fetchPerson = useCallback(async () => {
    if (!id || isNaN(id)) {
      setError('Invalid person ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { data } = await axios.get(
        `${BASE_URL}/person/${id}?api_key=${API_KEY}&language=en-US&append_to_response=combined_credits,external_ids`,
        { signal }
      );
      setPerson(data);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        setError('Failed to load cast details. Please try again.');
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [id, API_KEY]);

  useEffect(() => {
    fetchPerson();
    window.scrollTo(0, 0);
    return () => abortControllerRef.current?.abort();
  }, [fetchPerson]);

  // Preload Hero
  useEffect(() => {
    if (person && !preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = person.profile_path
        ? `https://image.tmdb.org/t/p/w1280${person.profile_path}`
        : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Image`;
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
  }, [person]);

  const handleImageError = (id) => setImageErrors(prev => ({ ...prev, [id]: true }));

  // Schema.org - Person with knownFor
  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": person?.name, "item": `https://gomovies.press/person/${slugify(person?.name)}-${id}` }
        ]
      },
      {
        "@type": "Person",
        "name": person?.name,
        "url": `https://gomovies.press/person/${slugify(person?.name)}-${id}`,
        "image": person?.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : null,
        "birthDate": formatISODate(person?.birthday),
        "birthPlace": person?.place_of_birth,
        "gender": person?.gender === 1 ? "Female" : person?.gender === 2 ? "Male" : "Other",
        "description": person?.biography,
        "sameAs": [
          person?.external_ids?.imdb_id ? `https://www.imdb.com/name/${person.external_ids.imdb_id}` : null,
          person?.homepage
        ].filter(Boolean),
        "knownFor": person?.combined_credits?.cast?.slice(0, 5).map(credit => ({
          "@type": credit.media_type === 'movie' ? "Movie" : "TVSeries",
          "name": credit.title || credit.name,
          "url": credit.media_type === 'movie' 
            ? `https://gomovies.press/movie/${slugify(credit.title)}-${credit.id}`
            : `https://gomovies.press/tv-show/${slugify(credit.name)}-${credit.id}`,
          "image": credit.poster_path ? `https://image.tmdb.org/t/p/w500${credit.poster_path}` : null,
          "dateCreated": formatISODate(credit.release_date || credit.first_air_date),
          "description": credit.overview || '',
          "director": credit.media_type === 'movie' && credit.crew
            ? credit.crew.find(member => member.job === 'Director')?.name || ''
            : ''
        }))
      }
    ]
  }), [person, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="text-center py-20 text-red-400 text-2xl bg-gray-900 min-h-screen">
        {error || "Person not found."}
      </div>
    );
  }

  const heroProfile = person.profile_path
    ? `https://image.tmdb.org/t/p/w1280${person.profile_path}`
    : `https://placehold.co/1280x720/111827/FFFFFF/png?text=No+Image`;
  const pageTitle = `${person.name} - Movies & TV Shows - GoMovies`;
  const metaDesc = `${person.biography.substring(0, 155)}... Discover ${person.name}'s filmography on GoMovies. Free HD streaming.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={`${person.name}, ${person.name} movies, watch ${person.name} online, actor ${person.name}, gomovies cast`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={heroProfile} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`https://gomovies.press/person/${slugify(person.name)}-${id}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero - Fast LCP */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroProfile.replace('w_1280', 'w_780')} media="(max-width: 768px)" />
            <img
              src={heroProfile}
              alt={`${person.name} profile`}
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">{person.name}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-bold mb-3 drop-shadow-2xl">
              {person.name}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-6">
              {person.known_for_department} • Born {person.birthday?.split('-')[0] || 'N/A'}
            </p>
            <button
              onClick={() => document.querySelector('.credits-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              View Filmography
            </button>
          </div>
        </section>

        {/* Floating Scroll */}
        <button
          onClick={() => document.querySelector('.credits-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="View credits"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 -mt-20 relative z-10">
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('bio')}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                activeTab === 'bio'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                  : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
              }`}
            >
              Biography
            </button>
            <button
              onClick={() => setActiveTab('filmography')}
              className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                activeTab === 'filmography'
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                  : 'bg-gray-800/70 border border-gray-600 hover:bg-gray-700/70'
              }`}
            >
              Filmography
            </button>
          </div>

          {activeTab === 'bio' && (
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl mb-12">
              <h2 className="text-3xl font-bold mb-6">Biography</h2>
              <p className="text-lg text-gray-200 leading-relaxed">
                {person.biography || 'No biography available.'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
                <div><span className="font-semibold text-gray-400">Born:</span> {person.birthday}</div>
                <div><span className="font-semibold text-gray-400">Place:</span> {person.place_of_birth}</div>
                <div><span className="font-semibold text-gray-400">Known For:</span> {person.known_for_department}</div>
                <div><span className="font-semibold text-gray-400">Popularity:</span> {person.popularity?.toFixed(1)}</div>
              </div>
            </section>
          )}

          {activeTab === 'filmography' && (
            <section className="credits-section">
              <h2 className="text-3xl font-bold text-center mb-6">Filmography</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {person.combined_credits.cast
                  .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                  .slice(0, 20)
                  .map(credit => (
                    <Link
                      key={credit.id}
                      to={credit.media_type === 'movie' ? `/movie/${slugify(credit.title)}-${credit.id}` : `/tv-show/${slugify(credit.name)}-${credit.id}`}
                      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-gray-800/50"
                    >
                      <div className="relative aspect-[2/3]">
                        <img
                          src={imageErrors[credit.id] || !credit.poster_path
                            ? 'https://placehold.co/300x450/000000/FFFFFF/png?text=No+Image'
                            : `https://image.tmdb.org/t/p/w300${credit.poster_path}`
                          }
                          alt={`${credit.title || credit.name} poster`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(credit.id)}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        {credit.vote_average > 0 && (
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {credit.vote_average.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                          {credit.title || credit.name}
                        </h3>
                        <p className="text-xs text-gray-400">{credit.media_type === 'movie' ? 'Movie' : 'TV'} • {credit.character}</p>
                        <p className="text-xs text-gray-500">{credit.release_date?.split('-')[0] || credit.first_air_date?.split('-')[0] || 'N/A'}</p>
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

export default CastDetail;