import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const About = () => {
  useEffect(() => {
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const heroImage = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1920&auto=format&fit=crop';
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
          { "@type": "ListItem", "position": 2, "name": "About", "item": "https://gomovies.press/about" }
        ]
      },
      {
        "@type": "Organization",
        "name": "GoMovies",
        "url": "https://gomovies.press",
        "logo": "https://gomovies.press/logo.png",
        "description": "Your premier destination for streaming movies and TV shows in HD. No signup required.",
        "sameAs": [
          "https://facebook.com/gomovies",
          "https://twitter.com/gomovies",
          "https://instagram.com/gomovies"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "info@gomovies.press",
          "contactType": "Customer Support"
        }
      },
      {
        "@type": "WebSite",
        "url": "https://gomovies.press",
        "name": "GoMovies",
        "description": "Stream movies and TV shows online free in HD",
        "publisher": { "@type": "Organization", "name": "GoMovies" }
      }
    ]
  }), []);

  const teamMembers = [
    { name: 'Alex Johnson', role: 'Founder & CEO', image: 'https://placehold.co/300x300/1a1a1a/FFFFFF/png?text=AJ&font=roboto' },
    { name: 'Sam Carter', role: 'Content Director', image: 'https://placehold.co/300x300/1a1a1a/FFFFFF/png?text=SC&font=roboto' },
    { name: 'Taylor Lee', role: 'Lead Developer', image: 'https://placehold.co/300x300/1a1a1a/FFFFFF/png?text=TL&font=roboto' },
  ];

  return (
    <>
      <Helmet>
        <title>About GoMovies - Free HD Streaming Platform | Movies & TV Shows</title>
        <meta name="description" content="Learn about GoMovies – your ultimate free streaming platform for movies and TV shows in HD. No signup, no ads, instant play." />
        <meta name="keywords" content="about gomovies, free movie streaming, watch tv shows online, hd streaming, no signup movies" />
        <meta property="og:title" content="About GoMovies - Stream Movies & TV Shows Free in HD" />
        <meta property="og:description" content="Discover GoMovies: free, fast, HD streaming of movies and TV shows. No registration needed." />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content="https://gomovies.press/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://gomovies.press/about" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-white">

        {/* Hero Section - Fast LCP */}
        <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
          <picture>
            <source srcSet={heroImage.replace('w=1920', 'w=780')} media="(max-width: 768px)" />
            <img
              src={heroImage}
              alt="GoMovies streaming platform hero"
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
              <span className="text-gray-400">About</span>
            </nav>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-500">
              About GoMovies
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Your <span className="text-red-400 font-bold">free</span> gateway to unlimited movies & TV shows in HD
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/movies"
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Start Watching
              </Link>
              <Link
                to="/tv-shows"
                className="bg-gray-800/70 hover:bg-gray-700/70 border border-gray-600 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm transition-all duration-300"
              >
                Explore TV Shows
              </Link>
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

            {/* Mission */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 003 14v2a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-.293-.707l-.707-.707V8a6 6 0 00-6-6z" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                At <span className="text-red-400 font-bold">GoMovies</span>, we believe entertainment should be <strong>free, instant, and accessible</strong> to everyone. 
                No subscriptions. No hidden fees. Just pure cinematic joy.
              </p>
            </section>

            {/* Features */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Why Choose GoMovies?</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "100% Free", desc: "No signup, no payment, no ads. Just click and watch." },
                  { title: "HD Quality", desc: "Stream in 720p and 1080p with fast loading." },
                  { title: "Daily Updates", desc: "New movies and episodes added every day." },
                  { title: "No Buffering", desc: "Optimized servers for smooth streaming." }
                ].map((feat, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-all">
                    <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-400 font-bold text-lg">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white">{feat.title}</h3>
                      <p className="text-gray-300">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Team */}
            <section className="bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Meet the Team</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {teamMembers.map(member => (
                  <div key={member.name} className="group text-center">
                    <div className="relative overflow-hidden rounded-2xl mb-4">
                      <img
                        src={member.image}
                        alt={`${member.name}, ${member.role} at GoMovies`}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-gray-400">{member.role}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section className="bg-gradient-to-r from-red-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-red-700/30 shadow-2xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-2xl mx-auto">
                Questions? Suggestions? We'd love to hear from you.
              </p>
              <a
                href="mailto:info@gomovies.press"
                className="inline-flex items-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Us: info@gomovies.press
              </a>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default About;