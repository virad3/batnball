
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
import SelectTeamsPage from './pages/SelectTeamsPage';
import { MatchProvider } from './contexts/MatchContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

const pathsToShowMainUITabs = ['/my-cricket', '/matches', '/tournaments', '/teams', '/stats', '/highlights'];

// Layout for authenticated users, adapted for v7+
const ProtectedLayoutWrapper: React.FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  if (authLoading && !user) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100">
            <LoadingSpinner size="sm" />
        </div>
    );
  }

  if (!user && !authLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const fullPageOverridePaths = ['/start-match/select-teams'];
  const isFullPageOverride = fullPageOverridePaths.some(p => location.pathname.startsWith(p));

  if (isFullPageOverride) {
    return <Outlet />; // Render child route directly without standard layout
  }
  
  const showTabs = pathsToShowMainUITabs.some(p => location.pathname.startsWith(p) || location.pathname === p);
  let mainContentPaddingTopClasses = "pt-[57px] sm:pt-[61px]"; // AppHeader height
  if (showTabs) {
    mainContentPaddingTopClasses = "pt-[105px] sm:pt-[117px]"; // AppHeader + MainUITabs height
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <AppHeader />
      {showTabs && <MainUITabs />}
      <main className={`flex-grow container mx-auto px-4 pb-4 mb-16 sm:mb-0 ${mainContentPaddingTopClasses}`}>
        <Outlet /> {/* Renders the matched child route */}
      </main>
      <BottomNav />
    </div>
  );
};


// Component to handle the main routing logic
const AppRoutes: React.FC = () => {
  const { loading: authLoading, user } = useAuth();

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
      <Route element={<ProtectedLayoutWrapper />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/matches/:matchId/score" element={<ScoringPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/tournaments/new" element={<CreateTournamentPage />} />
        <Route path="/tournaments/:tournamentId" element={<TournamentDetailPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
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
        <Route path="/start-match/select-teams" element={<SelectTeamsPage />} />
        
        {/* Fallback for authenticated users if no inner route matches */}
        <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
      </Route>
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
