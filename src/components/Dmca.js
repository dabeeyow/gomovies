import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const DMCA = () => {
  useEffect(() => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const heroImage = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1920&auto=format&fit=crop';
  const preloadLinkRef = React.useRef(null);

  // Preload hero image for LCP
  useEffect(() => {
    if (!preloadLinkRef.current) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = heroImage;
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
  }, []);

  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://gomovies.press" },
          { "@type": "ListItem", "position": 2, "name": "DMCA", "item": "https://gomovies.press/dmca" }
        ]
      },
      {
        "@type": "WebPage",
        "url": "https://gomovies.press/dmca",
        "name": "DMCA Policy - GoMovies",
        "description": "GoMovies DMCA Policy: We respect copyright and respond promptly to valid takedown notices.",
        "publisher": { "@type": "Organization", "name": "GoMovies" }
      }
    ]
  }), []);

  return (
    <>
      <Helmet>
        <title>DMCA Policy - GoMovies | Copyright Takedown Notice</title>
        <meta name="description" content="GoMovies DMCA Policy: Submit copyright takedown requests. We comply with the Digital Millennium Copyright Act." />
        <meta name="keywords" content="gomovies dmca, copyright takedown, dmca notice, remove copyrighted content, streaming dmca" />
        <meta property="og:title" content="DMCA Policy - GoMovies Free Streaming" />
        <meta property="og:description" content="Learn how to submit a DMCA takedown notice to GoMovies. We respect copyright holders." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content="https://gomovies.press/dmca" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://gomovies.press/dmca" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroImage.replace('w=1920', 'w=780')} media="(max-width: 768px)" />
            <img
              src={heroImage}
              alt="GoMovies DMCA copyright protection"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/60"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
            <nav className="flex justify-center text-sm text-gray-300 mb-4">
              <Link to="/" className="hover:text-red-400 transition-colors">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-400">DMCA</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              DMCA Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              We <span className="text-red-400 font-bold">respect copyright</span> and act fast
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:dmca@gomovies.press"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Submit DMCA Notice
              </a>
              <Link
                to="/"
                className="bg-gray-800/70 hover:bg-gray-700/70 border border-gray-600 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>

        {/* Floating CTA */}
        <button
          onClick={() => document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Explore policy"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 -mt-20 relative z-10 content-section">
          <div className="space-y-16">

            {/* Introduction */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">DMCA Compliance</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                GoMovies respects the intellectual property of others and complies with the <strong>Digital Millennium Copyright Act (DMCA)</strong>. 
                We promptly remove infringing content upon receiving a valid takedown notice.
              </p>
            </section>

            {/* How to Submit */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Submit a Takedown Notice</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
                To file a DMCA notice, send an email to <strong>dmca@gomovies.press</strong> with:
              </p>
              <ul className="space-y-3 text-lg text-gray-200">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">1.</span>
                  Identification of the copyrighted work claimed to have been infringed
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">2.</span>
                  URL(s) of the allegedly infringing material
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">3.</span>
                  Your contact information (name, address, phone, email)
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">4.</span>
                  A statement of good faith belief that use is not authorized
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">5.</span>
                  A statement under penalty of perjury that information is accurate
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">6.</span>
                  Your electronic or physical signature
                </li>
              </ul>
            </section>

            {/* Processing */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Processing Time</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Valid DMCA notices are processed within <strong>24-48 hours</strong>. 
                We remove content and notify the uploader. Repeat infringers are terminated.
              </p>
            </section>

            {/* Counter-Notice */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Counter-Notice</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                If content was removed in error, submit a counter-notice to <strong>dmca@gomovies.press</strong> with your consent to jurisdiction and acceptance of potential legal action.
              </p>
            </section>

            {/* Contact CTA */}
            <section className="bg-gradient-to-r from-red-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-red-700/30 shadow-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">File a DMCA Notice</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
                Protect your copyright. Send takedown requests to:
              </p>
              <a
                href="mailto:dmca@gomovies.press"
                className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                dmca@gomovies.press
              </a>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default DMCA;