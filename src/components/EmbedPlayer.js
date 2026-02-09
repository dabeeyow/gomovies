import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useMetaTags } from '../useMetaTags';

const EmbedPlayer = () => {
  // All hooks at top level
  const { slugId } = useParams();
  const location = useLocation();
  const pathParts = useMemo(() => location.pathname.split('/').filter(part => part), [location.pathname]);
  const isMovie = pathParts[1] === 'movie';
  const isEpisode = pathParts[1] === 'tv-show';

  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';
  const abortControllerRef = useRef(null);
  const schemaScriptRef = useRef(null);

  // Default values for useMetaTags
  const defaultTitle = isMovie ? 'Movie Embed' : 'Episode Embed';
  const defaultDescription = 'Embedded video player on GoMovies.';
  const defaultThumbnail = 'https://placehold.co/500x750/000000/FFFFFF/png?text=No+Image';
  const defaultUploadDate = new Date().toISOString();
  const defaultDuration = isMovie ? 'PT2H' : 'PT45M';
  const defaultContentUrl = isMovie ? `https://gomovies.press/videos/movie.mp4` : `https://gomovies.press/videos/tv.mp4`;
  const currentUrl = window.location.href;

  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: defaultTitle,
    description: defaultDescription,
    thumbnailUrl: defaultThumbnail,
    uploadDate: defaultUploadDate,
    duration: defaultDuration,
    contentUrl: defaultContentUrl,
    embedUrl: currentUrl
  };

  // Call useMetaTags unconditionally
  useMetaTags(
    `${defaultTitle} - GoMovies Embed`,
    defaultDescription,
    defaultThumbnail,
    'video.other',
    defaultSchema
  );

  const formatDuration = useCallback((minutes) => {
    if (!minutes || minutes <= 0) return isMovie ? 'PT2H' : 'PT45M';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `PT${hours}H${remainingMinutes}M`;
  }, [isMovie]);

  // Extract path values once
  const seasonNumber = isEpisode ? pathParts[4] : null;
  const episodeNumber = isEpisode ? pathParts[6] : null;

  // Memoize fetch deps
  const fetchMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isMovie) {
        const movieId = slugId.split('-').pop();
        const response = await axios.get(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
        setMetadata({ ...response.data, type: 'movie' });
      } else if (isEpisode) {
        const showId = pathParts[2].split('-').pop();
        const [showResponse, seasonResponse] = await Promise.all([
          axios.get(`${BASE_URL}/tv/${showId}?api_key=${API_KEY}&language=en-US`),
          axios.get(`${BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`),
        ]);
        const episodeData = seasonResponse.data.episodes.find(ep => ep.episode_number === parseInt(episodeNumber));
        if (!episodeData) throw new Error('Episode not found');
        setMetadata({ show: showResponse.data, episode: episodeData, type: 'episode' });
      }
    } catch (error) {
      console.error('Error fetching embed metadata:', error);
      setError('Failed to load video metadata.');
    } finally {
      setLoading(false);
    }
  }, [slugId, isMovie, isEpisode, seasonNumber, episodeNumber, API_KEY, BASE_URL, pathParts]);

  // Effect for fetching metadata
  useEffect(() => {
    fetchMetadata();

    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchMetadata]);

  // Compute display values once
  const displayData = useMemo(() => {
    if (!metadata) return null;
    
    const contentUrl = isMovie 
      ? `https://gomovies.press/videos/movie.mp4`
      : `https://gomovies.press/videos/tv.mp4`;
    
    const title = isMovie 
      ? metadata.title 
      : `${metadata.show.name} S${seasonNumber}E${episodeNumber}: ${metadata.episode.name}`;
    
    const description = isMovie ? metadata.overview : metadata.episode.overview;
    
    const thumbnailUrl = isMovie 
      ? (metadata.poster_path ? `https://image.tmdb.org/t/p/w300${metadata.poster_path}` : defaultThumbnail)
      : (metadata.episode.still_path ? `https://image.tmdb.org/t/p/w300${metadata.episode.still_path}` 
         : metadata.show.poster_path ? `https://image.tmdb.org/t/p/w300${metadata.show.poster_path}` : defaultThumbnail);
    
    const uploadDate = isMovie 
      ? (metadata.release_date ? new Date(metadata.release_date).toISOString() : defaultUploadDate)
      : (metadata.episode.air_date ? new Date(metadata.episode.air_date).toISOString() : defaultUploadDate);
    
    const duration = formatDuration(isMovie ? metadata.runtime : metadata.episode.runtime);

    return { contentUrl, title, description, thumbnailUrl, uploadDate, duration };
  }, [metadata, isMovie, seasonNumber, episodeNumber, formatDuration, defaultThumbnail, defaultUploadDate]);

  // Update meta tags and schema
  useEffect(() => {
    if (!displayData) return;

    // Update document title
    document.title = `${displayData.title} - GoMovies Embed`;

    // Helper to update or create meta tag
    const updateMeta = (selector, attributeName, attributeValue, contentValue) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (attributeName === 'name') element.setAttribute('name', attributeValue);
        if (attributeName === 'property') element.setAttribute('property', attributeValue);
        document.head.appendChild(element);
      }
      element.content = contentValue;
    };

    // Update meta tags
    updateMeta('meta[name="description"]', 'name', 'description', displayData.description || `Embedded video player for ${displayData.title}.`);
    updateMeta('meta[property="og:title"]', 'property', 'og:title', `${displayData.title} - GoMovies Embed`);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', displayData.description || `Embedded video player for ${displayData.title}.`);
    updateMeta('meta[property="og:image"]', 'property', 'og:image', displayData.thumbnailUrl);
    updateMeta('meta[property="og:type"]', 'property', 'og:type', 'video.other');

    // Update schema
    if (schemaScriptRef.current) {
      schemaScriptRef.current.remove();
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: displayData.title,
      description: displayData.description || 'Watch on GoMovies.',
      thumbnailUrl: displayData.thumbnailUrl,
      uploadDate: displayData.uploadDate,
      duration: displayData.duration,
      contentUrl: displayData.contentUrl,
      embedUrl: currentUrl
    });
    document.head.appendChild(script);
    schemaScriptRef.current = script;
  }, [displayData, currentUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schemaScriptRef.current) {
        schemaScriptRef.current.remove();
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !metadata || !displayData) {
    return (
      <div className="text-center py-8 text-red-500 bg-gray-900 h-screen flex items-center justify-center">
        <div>{error || 'Video not found.'}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-xl w-full h-96 md:h-screen flex items-center justify-center">
          <iframe
              src={isMovie ? `https://vidsrc.net/embed/movie?tmdb=${metadata.id}` : `https://vidsrc.net/embed/tv?tmdb=${metadata.show.id}&season=${seasonNumber}&episode=${episodeNumber}`}
              title={`${displayData.title} Player`}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            />
        </div>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-2">{displayData.title}</h1>
          <p className="text-gray-300 text-sm">{displayData.description}</p>
        </div>
      </div>
    </div>
  );
};

export default EmbedPlayer;