
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AppHeader from './components/AppHeader'; // New main header
import MainUITabs from './components/MainUITabs'; // New main navigation tabs
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

// Layout for authenticated users, includes new AppHeader, MainUITabs, and BottomNav
const ProtectedLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-gray-900">
    <AppHeader />
    <MainUITabs /> {/* This will contain MATCHES, TOURNAMENTS, TEAMS etc. */}
    {/* Apply padding top to main content area to account for fixed headers on mobile if needed */}
    {/* The class 'main-content-area' can be used for this, defined in index.html */}
    <main className="flex-grow container mx-auto p-4 mb-16 sm:mb-0"> {/* main-content-area removed for now, handle fixed positioning carefully */}
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
        <Route path="/teams" element={<MyTeamsPage />} /> {/* Route for "TEAMS" tab */}
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        
        <Route path="/profile/:userId?" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-teams" element={<MyTeamsPage />} /> {/* Retained for potential direct access or old links, "TEAMS" tab is primary */}
        <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
        <Route path="/my-performance" element={<MyPerformancePage />} /> 
        <Route path="/my-cricket" element={<MyCricketPage />} /> 
        <Route path="/looking" element={<LookingPage />} /> 
        
        {/* Catch-all for any other authenticated routes, redirects to /home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
      
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
