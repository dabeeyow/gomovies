require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { createGzip } = require('zlib');
const { pipeline } = require('stream').promises;
const { isValid, parse, format, isAfter } = require('date-fns');

// Simulated slugify function (should match utils/slugify.js)
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Validate and format date for lastmod
function validateDate(dateStr) {
  const fallbackDate = TODAY;
  if (!dateStr) {
    console.warn(`Invalid date: ${dateStr}, using fallback ${fallbackDate}`);
    return fallbackDate;
  }
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  const minDate = new Date(1971, 0, 1); // January 1, 1971
  if (isValid(parsedDate) && isAfter(parsedDate, minDate)) {
    return format(parsedDate, 'yyyy-MM-dd');
  }
  console.warn(`Invalid or pre-1971 date: ${dateStr}, using fallback ${fallbackDate}`);
  return fallbackDate;
}

// Validate API key
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const SITE_URL = 'https://gomovies.press';
const TODAY = new Date().toISOString().split('T')[0]; // Hardcoded for consistency
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const RATE_LIMIT_DELAY = 100; // 100ms (10 req/s, TMDB allows 50 req/s)
const MAX_URLS_PER_SITEMAP = 50000; // sitemap.org limit

if (!API_KEY) {
  console.error('Error: TMDB_API_KEY is not defined in .env file');
  process.exit(1);
}

// Delay function for rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i === retries || error.response?.status !== 429) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Fetch TMDB data with pagination and retries
async function fetchTMDBData(endpoint, maxItems = 1000) {
  let items = [];
  let page = 1;
  let totalPages = Infinity;

  while (items.length < maxItems && page <= totalPages) {
    let retries = 0;
    let success = false;
    let response;

    while (retries < MAX_RETRIES && !success) {
      try {
        await delay(RATE_LIMIT_DELAY);
        response = await axios.get(`${BASE_URL}${endpoint}`, {
          params: { api_key: API_KEY, language: 'en-US', page }
        });
        success = true;
      } catch (error) {
        retries++;
        if (error.response?.status === 429) {
          console.warn(`Rate limit hit for ${endpoint}, page ${page}. Retrying (${retries}/${MAX_RETRIES})...`);
          await delay(RETRY_DELAY * retries);
        } else if (retries === MAX_RETRIES) {
          console.error(`Failed to fetch ${endpoint}, page ${page} after ${MAX_RETRIES} retries: ${error.message}`);
          return items;
        }
      }
    }

    if (success && response?.data?.results) {
      const results = response.data.results || [];
      items = [...items, ...results];
      totalPages = response.data.total_pages || page;
      console.log(`Fetched ${results.length} items from ${endpoint}, page ${page}. Total: ${items.length}`);
      page++;
    } else {
      console.error(`No valid data for ${endpoint}, page ${page}`);
      break;
    }
  }

  return items.slice(0, maxItems);
}

// Generate individual sitemap XML
function generateSitemapXML(urls, name) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  xml += '</urlset>';
  return { xml, name };
}

// Generate sitemap index XML
function generateSitemapIndex(sitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${SITE_URL}/sitemap-${sitemap.name}.xml</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });
  xml += '</sitemapindex>';
  return xml;
}

// Write sitemap file with compression
async function writeSitemap(xml, filename) {
  const sitemapPath = path.join(__dirname, '../public', filename);
  const gzipPath = `${sitemapPath}.gz`;
  try {
    await fs.writeFile(sitemapPath, xml);
    console.log(`Sitemap generated at ${sitemapPath} (${xml.length} bytes)`);
    // const writeStream = fs.createWriteStream(gzipPath);
    // const gzip = createGzip();
    // await pipeline(Buffer.from(xml), gzip, writeStream);
    // console.log(`Compressed sitemap generated at ${gzipPath}`);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    throw error;
  }
}

async function generateSitemap() {
  // Static URLs
  const staticUrls = [
    { loc: `${SITE_URL}/`, lastmod: TODAY, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/movies`, lastmod: TODAY, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/tv-shows`, lastmod: TODAY, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE_URL}/about`, lastmod: TODAY, changefreq: 'weekly', priority: '0.5' },
    { loc: `${SITE_URL}/privacy`, lastmod: TODAY, changefreq: 'weekly', priority: '0.5' },
    { loc: `${SITE_URL}/terms`, lastmod: TODAY, changefreq: 'weekly', priority: '0.5' }
  ];

  

  // Fetch Genres
  let movieGenres = [];
  try {
    await delay(RATE_LIMIT_DELAY);
    const movieResponse = await axios.get(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    movieGenres = movieResponse.data.genres || [];
    console.log(`Fetched ${movieGenres.length} movie genres`);
  } catch (error) {
    console.error('Error fetching movie genres:', error.message);
  }

  let tvGenres = [];
  try {
    await delay(RATE_LIMIT_DELAY);
    const tvResponse = await axios.get(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=en-US`);
    tvGenres = tvResponse.data.genres || [];
    console.log(`Fetched ${tvGenres.length} TV genres`);
  } catch (error) {
    console.error('Error fetching TV genres:', error.message);
  }

  const uniqueGenres = [...new Map([...movieGenres, ...tvGenres].map(g => [g.id, g])).values()];
  const genreUrls = uniqueGenres
    .filter(genre => genre.id && genre.name)
    .map(genre => ({
      loc: `${SITE_URL}/genre/${slugify(genre.name)}-${genre.id}`,
      lastmod: TODAY,
      changefreq: 'daily',
      priority: '0.7'
    }));

  // Fetch Movies (up to 1000), prioritize by popularity
  const movies = await fetchTMDBData('/movie/popular', 1000);
  const movieUrls = movies
    .filter(movie => movie.id && movie.title && movie.popularity && movie.vote_count)
    .sort((a, b) => b.popularity - a.popularity) // Sort by popularity
    .map(movie => ({
      loc: `${SITE_URL}/movie/${slugify(movie.title)}-${movie.id}`,
      lastmod: validateDate(movie.release_date),
      changefreq: movie.popularity > 100 ? 'daily' : 'weekly', // High popularity = daily
      priority: Math.min(0.8 + (movie.popularity / 1000), 1.0).toFixed(1) // Dynamic priority
    }));

  // Fetch TV Shows (up to 1000), prioritize by popularity
  const tvShows = await fetchTMDBData('/tv/popular', 1000);
  // Fetch last_episode_to_air for each TV show
  const tvShowDetails = await Promise.all(
    tvShows.map(async (show) => {
      try {
        const showDetail = await fetchWithRetry(
          `${BASE_URL}/tv/${show.id}?api_key=${API_KEY}&language=en-US&append_to_response=last_air_date`
        );
        return { ...show, last_air_date: showDetail.last_air_date || null };
      } catch (error) {
        console.error(`Error fetching details for TV show ${show.id}:`, error);
        return show;
      }
    })
  );
  const tvUrls = tvShowDetails
    .filter(show => show.id && show.name && show.popularity && show.vote_count)
    .sort((a, b) => b.popularity - a.popularity)
    .map(show => ({
      loc: `${SITE_URL}/tv-show/${slugify(show.name)}-${show.id}`,
      lastmod: validateDate(show.last_air_date),
      changefreq: show.popularity > 100 ? 'daily' : 'weekly',
      priority: Math.min(0.8 + (show.popularity / 1000), 1.0).toFixed(1)
    }));

  // Fetch Persons (up to 500), lower priority
  const persons = await fetchTMDBData('/person/popular', 500);
  const personUrls = persons
    .filter(person => person.id && person.name)
    .map(person => ({
      loc: `${SITE_URL}/person/${slugify(person.name)}-${person.id}`,
      lastmod: TODAY,
      changefreq: 'weekly',
      priority: '0.6'
    }));

  // Combine URLs into separate sitemaps
  const sitemaps = [
    generateSitemapXML([...staticUrls, ...genreUrls], 'static-genres'),
    generateSitemapXML(movieUrls, 'movies'),
    generateSitemapXML(tvUrls, 'tv-shows'),
    generateSitemapXML(personUrls, 'persons')
  ];

  // Write individual sitemaps
  for (const sitemap of sitemaps) {
    if (sitemap.xml.length > 50 * 1024 * 1024) {
      console.error(`Sitemap ${sitemap.name} exceeds 50MB, consider splitting further`);
      continue;
    }
    await writeSitemap(sitemap.xml, `sitemap-${sitemap.name}.xml`);
  }

  // Write sitemap index
  const sitemapIndexXML = generateSitemapIndex(sitemaps);
  await writeSitemap(sitemapIndexXML, 'sitemapindex.xml');

  console.log(`Generated ${sitemaps.length} sitemaps with ${movieUrls.length + tvUrls.length + personUrls.length + staticUrls.length + genreUrls.length} total URLs`);
}

generateSitemap().catch(err => {
  console.error('Sitemap generation failed:', err.message);
  process.exit(1);
});