
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'; // Updated imports for v7
import AppHeader from './components/AppHeader';
import MainUITabs from './components/MainUITabs';
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

// Layout for authenticated users
const ProtectedLayout: React.FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth(); // Auth check within layout

  const showTabs = pathsToShowMainUITabs.some(p => location.pathname.startsWith(p) || location.pathname === p);

  let mainContentPaddingTopClasses = "pt-[57px] sm:pt-[61px]";
  if (showTabs) {
    mainContentPaddingTopClasses = "pt-[105px] sm:pt-[117px]";
  }

  if (authLoading && !user) {
    // This minimal loading is if ProtectedLayout itself is rendered while auth is resolving
    // The main loading spinner is handled in AppRoutes before any route is chosen
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100">
            <LoadingSpinner size="sm" />
        </div>
    );
  }

  if (!user && !authLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <AppHeader />
      {showTabs && <MainUITabs />}
      <main className={`flex-grow container mx-auto px-4 pb-4 mb-16 sm:mb-0 ${mainContentPaddingTopClasses}`}>
        <Outlet /> {/* Child routes will render here */}
      </main>
      <BottomNav />
    </div>
  );
};


// Component to handle the main routing logic
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:matchId/score" element={<ScoringPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/new" element={<CreateTournamentPage />} />
        <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailsPage />} />
        <Route path="/teams" element={<MyTeamsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/highlights" element={<HighlightsPage />} />
        
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
          
        <Route path="/my-teams" element={<MyTeamsPage />} /> 
        <Route path="/my-performance" element={<MyPerformancePage />} />
        <Route path="/my-cricket" element={<MyCricketPage />} />
        <Route path="/looking" element={<LookingPage />} />
      </Route>
      
      {/* Fallback for any other path */}
      <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
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
