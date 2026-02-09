import React from "react";
import { HelmetProvider } from "react-helmet-async";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
// import Home from "./components/Home";
import HomePage from "./components/HomePage";
import Movies from "./components/Movies";
import FilterPage from "./components/FilterPage";
import TvShows from "./components/TvShows";
import SearchResults from "./components/SearchResults";
import MovieDetail from "./components/MovieDetail";
import TvDetail from "./components/TvDetail";
import SeasonDetail from "./components/SeasonDetail";
import EpisodeDetail from "./components/EpisodeDetail";
import Genres from "./components/Genres";
import About from "./components/About";
import Privacy from "./components/Privacy";
import Terms from "./components/Terms";
import DMCA from "./components/Dmca";
import Trending from "./components/Trending";
import CastDetail from "./components/CastDetail";
import GenreDetail from "./components/GenreDetail";
import EmbedPlayer from "./components/EmbedPlayer";
import useZarazPageView from "./useAnalytics";

function ZarazTracker() {
  useZarazPageView();
  return null; // no UI — just tracking
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          <main className="container mx-auto p-4 flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TvShows />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/movie/:slugId" element={<MovieDetail />} />
              <Route path="/filter" element={<FilterPage />} />
              <Route path="/tv/:slugId" element={<TvDetail />} />
              <Route path="/tv-show/:slugId" element={<TvDetail />} />
              <Route
                path="/tv-show/:slugId/season/:seasonNumber"
                element={<SeasonDetail />}
              />
              <Route
                path="/tv-show/:slugId/season/:seasonNumber/episode/:episodeNumber"
                element={<EpisodeDetail />}
              />
              <Route path="/embed/movie/:slugId" element={<EmbedPlayer />} />
              <Route
                path="/embed/tv-show/:slugId/season/:seasonNumber/episode/:episodeNumber"
                element={<EmbedPlayer />}
              />
              <Route path="/person/:slugId" element={<CastDetail />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/genre/:slugId" element={<GenreDetail />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/dmca" element={<DMCA />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ZarazTracker />
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
