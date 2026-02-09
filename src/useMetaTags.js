import { useEffect } from 'react';

export const useMetaTags = (title, description, image = null, type = 'website', schema) => {
  useEffect(() => {
    // Update title
    document.title = title ? `${title} | GoMovies` : 'GoMovies';

    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';      
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = window.location.href;

    // Update description meta
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = description || 'Stream movies and TV shows on GoMovies.';

    // Open Graph tags
    const ogTags = {
      title: { property: 'og:title', content: title || 'GoMovies' },
      description: { property: 'og:description', content: description || 'Stream movies and TV shows.' },
      image: { property: 'og:image', content: image },
      type: { property: 'og:type', content: type }
    };

    Object.entries(ogTags).forEach(([key, { property, content }]) => {
      if (content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.property = property;
          document.head.appendChild(meta);
        }
        meta.content = content;
      }
    });

    // Twitter card (basic)
    let twitterMeta = document.querySelector('meta[name="twitter:card"]');
    if (!twitterMeta) {
      twitterMeta = document.createElement('meta');
      twitterMeta.name = 'twitter:card';
      twitterMeta.content = 'summary_large_image';
      document.head.appendChild(twitterMeta);
    }

    // Add schema
    if (schema) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }

    // Cleanup on unmount (optional)
    return () => {
      // document.title = 'GoMovies';
      // const descMetaCleanup = document.querySelector('meta[name="description"]');
      // if (descMetaCleanup) descMetaCleanup.content = 'Stream movies and TV shows on GoMovies.';
    };
  }, [title, description, image, type, schema]);
};