
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import MatchesPage from './pages/MatchesPage';
import ScoringPage from './pages/ScoringPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import CreateTournamentPage from './pages/CreateTournamentPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import MyTeamsPage from './pages/MyTeamsPage';
import MyPerformancePage from './pages/MyPerformancePage';
import { MatchProvider } from './contexts/MatchContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <MatchProvider>
        <div className="flex flex-col min-h-screen bg-[#f9fbe7]">
          <Header />
          <main className="flex-grow container mx-auto p-4 mb-16 sm:mb-0">
            <Routes>
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/:matchId/score" element={<ScoringPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/new" element={<CreateTournamentPage />} />
              <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/my-teams" element={<MyTeamsPage />} />
              <Route path="/profile/my-performance" element={<MyPerformancePage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </MatchProvider>
    </HashRouter>
  );
};

export default App;
