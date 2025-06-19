
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import MyTeamsPage from './pages/MyTeamsPage'; 
import TeamDetailsPage from './pages/TeamDetailsPage'; 
import MyPerformancePage from './pages/MyPerformancePage'; 
import MyCricketPage from './pages/MyCricketPage'; 
import LookingPage from './pages/LookingPage'; 
import HighlightsPage from './pages/HighlightsPage'; 
import { MatchProvider } from './contexts/MatchContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Layout for authenticated users, includes Header and BottomNav
const ProtectedLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-gray-900">
    <Header />
    <main className="flex-grow container mx-auto p-4 mb-16 sm:mb-0">
      <Outlet /> {/* Nested routes render here */}
    </main>
    <BottomNav />
  </div>
);

// Component to handle the main routing logic after AuthProvider is initialized
const AppRoutes: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-xl">Loading Application...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignUpPage />} />

      {/* Protected Routes */}
      <Route element={user ? <ProtectedLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:matchId/score" element={<ScoringPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/new" element={<CreateTournamentPage />} />
        <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/profile/:userId?" element={<ProfilePage />} /> {/* Updated Route */}
        <Route path="/profile" element={<ProfilePage />} /> {/* Fallback for /profile, effectively /profile/undefined -> logged-in user */}
        <Route path="/my-teams" element={<MyTeamsPage />} /> 
        <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
        <Route path="/my-performance" element={<MyPerformancePage />} /> 
        <Route path="/my-cricket" element={<MyCricketPage />} /> 
        <Route path="/looking" element={<LookingPage />} /> 
        <Route path="/highlights" element={<HighlightsPage />} /> 
        {/* Catch-all for any other authenticated routes, redirects to /home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
      
      {/* Fallback for any unhandled paths when user is not defined (already handled by above) */}
       {!user && <Route path="*" element={<Navigate to="/login" replace />} />}
    </Routes>
  );
}


const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <MatchProvider>
          <AppRoutes />
        </MatchProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;