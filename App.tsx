
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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

const pathsToShowMainUITabs = ['/my-cricket', '/matches', '/tournaments', '/teams', '/stats', '/highlights'];

// Layout for authenticated users, includes new AppHeader, MainUITabs, and BottomNav
const ProtectedLayout: React.FC = () => {
  const location = useLocation();
  const showTabs = pathsToShowMainUITabs.some(p => location.pathname.startsWith(p));

  // AppHeader height: mobile 57px, sm+ 61px
  // MainUITabs height: mobile 48px, sm+ 56px
  let mainContentPaddingTopClasses = "pt-[57px] sm:pt-[61px]"; // Padding for AppHeader only
  if (showTabs) {
    mainContentPaddingTopClasses = "pt-[105px] sm:pt-[117px]"; // Padding for AppHeader + MainUITabs
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <AppHeader />
      {showTabs && <MainUITabs />}
      <main className={`flex-grow container mx-auto px-4 pb-4 mb-16 sm:mb-0 ${mainContentPaddingTopClasses}`}>
        <Outlet /> {/* Nested routes render here */}
      </main>
      <BottomNav />
    </div>
  );
};

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
        <Route path="/profile" element={<ProfilePage />} /> {/* Default to own profile if no ID */}
        
        <Route path="/my-teams" element={<MyTeamsPage />} /> {/* Retained for potential direct access, "TEAMS" tab is primary */}
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
