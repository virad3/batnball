
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
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { MatchProvider } from './contexts/MatchContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <MatchProvider>
          <div className="flex flex-col min-h-screen bg-gray-900">
            <Header />
            <main className="flex-grow container mx-auto p-4 mb-16 sm:mb-0">
              <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:matchId/score" element={<ScoringPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/tournaments/new" element={<CreateTournamentPage />} />
                <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </MatchProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;