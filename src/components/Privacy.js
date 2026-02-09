import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Privacy = () => {
  useEffect(() => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const heroImage = 'https://images.unsplash.com/photo-1633265486064-086b219458ec?q=80&w=1920&auto=format&fit=crop';
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
          { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://gomovies.press/privacy" }
        ]
      },
      {
        "@type": "WebPage",
        "url": "https://gomovies.press/privacy",
        "name": "Privacy Policy - GoMovies",
        "description": "GoMovies Privacy Policy: Learn how we protect your data while providing free HD streaming of movies and TV shows.",
        "publisher": { "@type": "Organization", "name": "GoMovies" }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What data do you collect?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We collect information such as your email address when you contact us, as well as usage data like pages visited to improve our services."
            }
          },
          {
            "@type": "Question",
            "name": "How can I delete my data?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can request deletion of your personal data by contacting us at info@gomovies.press."
            }
          },
          {
            "@type": "Question",
            "name": "Do you use cookies?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, we use cookies to enhance your browsing experience and provide personalized recommendations."
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
      question: 'What data do you collect?',
      answer: 'We collect information such as your email address when you contact us, as well as usage data like pages visited to improve our services.'
    },
    {
      question: 'How can I delete my data?',
      answer: 'You can request deletion of your personal data by contacting us at info@gomovies.press.'
    },
    {
      question: 'Do you use cookies?',
      answer: 'Yes, we use cookies to enhance your browsing experience and provide personalized recommendations.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy - GoMovies | Free HD Streaming Data Protection</title>
        <meta name="description" content="GoMovies Privacy Policy: We prioritize your privacy while offering free HD streaming of movies and TV shows. No personal data collection without consent." />
        <meta name="keywords" content="gomovies privacy policy, free streaming privacy, watch movies privacy, tv shows data protection, no signup streaming" />
        <meta property="og:title" content="Privacy Policy - GoMovies Free HD Streaming" />
        <meta property="og:description" content="Learn how GoMovies protects your data. Free, secure streaming with minimal data collection." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content="https://gomovies.press/privacy" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://gomovies.press/privacy" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section - Fast LCP */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroImage.replace('w=1920', 'w=780')} media="(max-width: 768px)" />
            <img
              src={heroImage}
              alt="GoMovies privacy protection illustration"
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
              <span className="text-gray-400">Privacy Policy</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Your <span className="text-red-400 font-bold">privacy</span> is our priority
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
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Introduction</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                At <span className="text-red-400 font-bold">GoMovies</span>, we respect your privacy and are committed to protecting your personal information. 
                This policy explains our practices for free HD streaming services.
              </p>
            </section>

            {/* Data Collection */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Information We Collect</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
                We minimize data collection to essentials:
              </p>
              <ul className="text-lg text-gray-200 list-disc list-inside space-y-2">
                <li>Usage data (e.g., pages visited) for service improvement</li>
                <li>Device information for optimal streaming</li>
                <li>Contact details if you reach out to us</li>
              </ul>
            </section>

            {/* Use of Information */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5zm8 10a2 2 0 002-2v-1h2a2 2 0 002 2v4a2 2 0 01-2 2h-7a2 2 0 01-2-2v-4a2 2 0 012-2h1v1l3-3z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">How We Use Your Information</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Your data helps us maintain secure, high-quality streaming while respecting your privacy.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 5 5 0 013 9.025 5 5 0 013-9.025zm1.013 1.184a3 3 0 00-1.265.98 3 3 0 00-1.265-.98A3 3 0 0013 6.816V7a3 3 0 10-6 .816V7a3 3 0 001.013-.184zM10 16a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Data Sharing & Security</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                We don't sell your data. Sharing occurs only with trusted partners for service delivery. Industry-standard security protects your information.
              </p>
            </section>

            {/* Your Rights */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Your Rights & Choices</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
                Access, update, or delete your data anytime. Opt out of cookies via browser settings.
              </p>
              <a
                href="mailto:info@gomovies.press"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-bold text-white shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Request Data Access
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

export default Privacy;