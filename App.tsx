

import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import MainUITabs from './components/MainUITabs';
import BottomNav from './components/BottomNav';
import { SearchOverlay } from './components/SearchOverlay'; // Use named import
import SideMenu from './components/SideMenu'; // Import SideMenu
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
import TossPage from './pages/TossPage'; // Import TossPage
import { MatchProvider } from './contexts/MatchContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

const pathsToShowMainUITabs = ['/my-cricket', '/matches', '/tournaments', '/teams', '/stats', '/highlights'];

// Layout for authenticated users, adapted for v7+
const ProtectedLayoutWrapperAdjusted: React.FC<{isSearchActive: boolean, isSideMenuOpen: boolean}> = ({ isSearchActive, isSideMenuOpen }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  if (authLoading && !user) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100"><LoadingSpinner size="sm" /></div>;
  }
  if (!user && !authLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const fullPageOverridePaths = ['/start-match/select-teams', '/toss']; // Added /toss
  const isFullPageOverride = fullPageOverridePaths.some(p => location.pathname.startsWith(p));

  // If search or side menu is active, or it's a full-page override, only render Outlet
  if (isFullPageOverride || isSearchActive || isSideMenuOpen) {
    return <Outlet />;
  }
  
  const showTabs = pathsToShowMainUITabs.some(p => location.pathname.startsWith(p) || location.pathname === p);
  // AppHeader height is 57px (sm: 61px). MainUITabs height is 48px (sm: 56px).
  // Total height when both visible: 105px (sm: 117px).
  const paddingTopClass = showTabs ? "pt-[105px] sm:pt-[117px]" : "pt-[57px] sm:pt-[61px]";


  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {showTabs && <MainUITabs />}
      <main className={`flex-grow container mx-auto px-4 pb-4 mb-16 sm:mb-0 ${paddingTopClass}`}>
        <Outlet />
      </main>
    </div>
  );
};


// Main App component structure
const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <MatchProvider>
          <AppRoutesController />
        </MatchProvider>
      </AuthProvider>
    </HashRouter>
  );
};

// New controller component to manage AppHeader, BottomNav, SearchOverlay, and SideMenu visibility
const AppRoutesController: React.FC = () => {
  const { loading: authLoading, user } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Changed initial state from 'Vi' to ''
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false); // State for SideMenu
  const location = useLocation();

  const toggleSearchActive = () => {
    setIsSearchActive(prev => !prev);
    if (!isSearchActive) setIsSideMenuOpen(false); // Close side menu if search opens
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(prev => !prev);
    if (!isSideMenuOpen) setIsSearchActive(false); // Close search if side menu opens
  };

  const fullPageOverridePaths = ['/start-match/select-teams', '/toss']; // Added /toss
  const isFullPageOverride = fullPageOverridePaths.some(p => location.pathname.startsWith(p));
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  // Show AppHeader if user exists, not on auth pages, not on full page override, and neither search nor side menu is active.
  // The AppHeader itself will be rendered regardless of search/menu, but its content might be obscured.
  // We hide AppHeader if SearchOverlay or SideMenu is active to prevent visual glitches or double headers.
  const showAppHeader = user && !isAuthPage && !isFullPageOverride && !isSearchActive && !isSideMenuOpen;
  
  // BottomNav visibility
  const showBottomNav = user && !isAuthPage && !isFullPageOverride && !isSearchActive && !isSideMenuOpen;


  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100">
        <LoadingSpinner size="lg" /><p className="ml-4 text-xl">Loading Application...</p>
      </div>
    );
  }
  
  return (
    <>
      {/* AppHeader is rendered here and gets props to open search or menu */}
      {user && !isAuthPage && !isFullPageOverride && (
         <AppHeader onSearchClick={toggleSearchActive} onMenuClick={toggleSideMenu} />
      )}
      
      {isSearchActive && user && (
        <SearchOverlay
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={toggleSearchActive}
        />
      )}
      {isSideMenuOpen && user && (
        <SideMenu 
          isOpen={isSideMenuOpen} 
          onClose={toggleSideMenu} 
        />
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route element={<ProtectedLayoutWrapperAdjusted isSearchActive={isSearchActive} isSideMenuOpen={isSideMenuOpen} />}>
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
            <Route path="/toss" element={<TossPage />} /> {/* New Toss Page Route */}
            <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
        </Route>
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  );
}

export default App;