import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const navItems = useMemo(() => [
    { to: '/', label: 'Home' },
    { to: '/movies', label: 'Movies' },
    { to: '/tv-shows', label: 'TV Shows' },
    { to: '/genres', label: 'Genres' },
    { to: '/trending', label: 'Trending' },
    { to: '/about', label: 'About' },
    { to: '/privacy', label: 'Privacy' },
    { to: '/terms', label: 'Terms' },
  ], []);

  const socialLinks = useMemo(() => [
    { href: 'https://x.com/gomovies', label: 'X', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
    { href: 'https://facebook.com/gomovies', label: 'Facebook', icon: <path d="M12 2.04c-5.513 0-10 4.486-10 10 0 4.978 3.657 8.103 8.438 9.869v-6.981h-2.541v-2.888h2.541v-2.203c0-2.506 1.493-3.891 3.776-3.891 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.877h2.773l-.443 2.888h-2.33v6.981c4.781-.766 8.438-4.891 8.438-9.869 0-5.514-4.486-10-10-10z" /> },
    { href: 'https://instagram.com/gomovies', label: 'Instagram', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.326 3.608 1.301.975.975 1.24 2.242 1.301 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.326 2.633-1.301 3.608-.975.975-2.242 1.24-3.608 1.301-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.326-3.608-1.301-.975-.975-1.24-2.242-1.301-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.326-2.633 1.301-3.608.975-.975 2.242-1.24 3.608-1.301 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.465.067-2.867.364-3.957 1.454C1.893 2.728 1.596 4.13 1.529 5.595c-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.067 1.465.364 2.867 1.454 3.957 1.101 1.101 2.503 1.398 3.957 1.454 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.465-.067 2.867-.364 3.957-1.454 1.101-1.101 1.398-2.503 1.454-3.957.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.067-1.465-.364-2.867-1.454-3.957-1.101-1.101-2.503-1.398-3.957-1.454-1.28-.058-1.688-.072-4.947-.072zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /> },
  ], []);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Please enter an email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    // Mock API call
    setTimeout(() => {
      setSubscribeSuccess(true);
      setEmail('');
      setTimeout(() => setSubscribeSuccess(false), 3000);
    }, 1000);
  };

  const schema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GoMovies",
    "url": "https://gomovies.press",
    "logo": "https://gomovies.press/logo.png",
    "sameAs": socialLinks.map(link => link.href),
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@gomovies.press",
      "contactType": "Customer Support"
    }
  }), [socialLinks]);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <footer className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 shadow-2xl py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Link 
              to="/" 
              className="group mb-6"
              aria-label="GoMovies Home"
            >
              <div className="relative">
                <img
                  src="https://gomovies.press/gomovies-logo.png"
                  alt="GoMovies - Free HD Movies & TV Shows Streaming"
                  className="w-36 h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  width="180"
                  height="60"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            </Link>
            <p className="text-white-400 text-center md:text-left text-sm mb-4">
              Free HD streaming of movies & TV shows. No signup required.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-white-400 hover:text-red-400 transition-all duration-300 hover:scale-125"
                  aria-label={link.label}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    {link.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Quick Links</h3>
            <ul className="space-y-3">
              {navItems.map(item => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-white-400 hover:text-red-400 transition-colors duration-300 text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Contact Us</h3>
            <ul className="space-y-3 text-white-400 text-sm">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a 
                  href="mailto:info@gomovies.press" 
                  className="hover:text-red-400 transition-colors"
                  aria-label="Email support"
                >
                  info@gomovies.press
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 0110.9 0l2.12-2.12a9 9 0 10-12.728 12.728l-2.122 2.122a7 7 0 010-10.9zM14.95 14.95a7 7 0 010-10.9L12.828 2.05a9 9 0 100 12.728l2.122-2.122z" clipRule="evenodd" />
                </svg>
                <span>24/7 Support</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Updated: {new Date().getFullYear()}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Newsletter</h3>
            <p className="text-white-400 text-sm mb-4">Get latest movies & shows updates</p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="Your email"
                  className="w-full px-4 py-3 rounded-full bg-gray-800/80 border border-gray-700/50 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 pr-12"
                  aria-label="Newsletter email"
                  aria-describedby="email-error"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 p-2 rounded-full text-white shadow-md hover:shadow-lg transition-all duration-300"
                  aria-label="Subscribe"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              {emailError && (
                <p id="email-error" className="text-red-400 text-xs text-center">{emailError}</p>
              )}
              {subscribeSuccess && (
                <p className="text-green-400 text-xs text-center animate-fade-in">Subscribed successfully!</p>
              )}
            </form>
          </div>

        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-gray-700/50 text-center text-white-500 text-xs">
          <p>© {new Date().getFullYear()} GoMovies. All rights reserved.</p>
          <p className="mt-1">Free streaming platform. Not affiliated with TMDB. <Link to="/dmca" className="hover:text-red-400 transition-colors">DMCA</Link></p>
        </div>
    </footer>
    </>
  );
};

export default Footer;