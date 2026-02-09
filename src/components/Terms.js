import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Terms = () => {
  useEffect(() => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const heroImage = 'https://images.unsplash.com/photo-1652690527826-dcddbd1eb46e?q=80&w=1920&auto=format&fit=crop';
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
          { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://gomovies.press/terms" }
        ]
      },
      {
        "@type": "WebPage",
        "url": "https://gomovies.press/terms",
        "name": "Terms of Service - GoMovies",
        "description": "GoMovies Terms of Service: Guidelines for using our free HD streaming platform for movies and TV shows.",
        "publisher": { "@type": "Organization", "name": "GoMovies" }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Can I share my account with others?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Account sharing is permitted for personal, non-commercial use only. You are responsible for all activity under your account."
            }
          },
          {
            "@type": "Question",
            "name": "What happens if I violate the Terms of Service?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Violations may result in account suspension or termination. Please review the Terms for details."
            }
          },
          {
            "@type": "Question",
            "name": "How can I contact support for terms-related questions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can reach us at info@gomovies.press for any questions or concerns about our Terms of Service."
            }
          }
        ]
      }
    ]
  }), []);

  const [faqOpen, setFaqOpen] = useState({});

  const toggleFaq = (index) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const faqs = [
    {
      question: 'Can I share my account with others?',
      answer: 'Account sharing is permitted for personal, non-commercial use only. You are responsible for all activity under your account.'
    },
    {
      question: 'What happens if I violate the Terms of Service?',
      answer: 'Violations may result in account suspension or termination. Please review the Terms for details.'
    },
    {
      question: 'How can I contact support for terms-related questions?',
      answer: 'You can reach us at info@gomovies.press for any questions or concerns about our Terms of Service.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Terms of Service - GoMovies | Free HD Streaming Guidelines</title>
        <meta name="description" content="GoMovies Terms of Service: Understand the rules for using our free HD streaming platform. No signup required for movies and TV shows." />
        <meta name="keywords" content="gomovies terms of service, free streaming terms, watch movies terms, tv shows guidelines, no signup streaming" />
        <meta property="og:title" content="Terms of Service - GoMovies Free HD Streaming" />
        <meta property="og:description" content="Review GoMovies guidelines for fair use of our free streaming service." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content="https://gomovies.press/terms" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://gomovies.press/terms" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section - Fast LCP */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroImage.replace('w=1920', 'w=780')} media="(max-width: 768px)" />
            <img
              src={heroImage}
              alt="GoMovies terms of service illustration"
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
              <span className="text-gray-400">Terms of Service</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Guidelines for <span className="text-red-400 font-bold">fair use</span> of our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Back to Home
              </Link>
              <a
                href="mailto:info@gomovies.press"
                className="bg-gray-800/70 hover:bg-gray-700/70 border border-gray-600 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm transition-all duration-300"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>

        {/* Floating CTA */}
        <button
          onClick={() => document.querySelector('.content-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 p-4 rounded-full shadow-2xl z-50 transition-all hover:scale-110"
          aria-label="Explore more"
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
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Introduction</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                These <span className="text-red-400 font-bold">Terms of Service</span> govern your use of GoMovies. By accessing our platform, you agree to these terms.
              </p>
            </section>

            {/* Acceptance */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Acceptance of Terms</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Using GoMovies constitutes acceptance of these terms. If you disagree, please do not use our service.
              </p>
            </section>

            {/* Use of Service */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5zm8 10a2 2 0 002-2v-1h2a2 2 0 002 2v4a2 2 0 01-2 2h-7a2 2 0 01-2-2v-4a2 2 0 012-2h1v1l3-3z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Use of Service</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Stream for personal use only. Commercial use, distribution, or modification of content is prohibited.
              </p>
            </section>

            {/* Account Responsibilities */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Account Responsibilities</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Keep your account secure. You're responsible for all activities under your credentials.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-red-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-red-700/30 shadow-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Questions?</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
                Contact us for clarification on any terms.
              </p>
              <a
                href="mailto:info@gomovies.press"
                className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                info@gomovies.press
              </a>
            </section>

            {/* FAQ */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-700/50">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex justify-between items-center text-lg font-semibold text-white py-4 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-expanded={faqOpen[index] || false}
                      aria-controls={`faq-${index}`}
                    >
                      {faq.question}
                      <svg
                        className={`w-6 h-6 transform transition-transform duration-300 ${faqOpen[index] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {faqOpen[index] && (
                      <div id={`faq-${index}`} className="text-gray-200 text-lg leading-relaxed pb-4">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default Terms;