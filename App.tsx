
import React from 'react';
import { HashRouter, Switch, Route, Redirect, useLocation, useHistory } from 'react-router-dom';
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

// Layout for authenticated users, adapted for v5
const ProtectedLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    return <Redirect to={{ pathname: "/login", state: { from: location } }} />;
  }
  
  const fullPageOverridePaths = ['/start-match/select-teams'];
  const isFullPageOverride = fullPageOverridePaths.some(p => location.pathname.startsWith(p));

  if (isFullPageOverride) {
    return <>{children}</>; // Render child route directly without standard layout
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
        {children} {/* Renders the matched component from the inner Switch */}
      </main>
      <BottomNav />
    </div>
  );
};

// This component will contain all routes that need the ProtectedLayoutWrapper
const ProtectedRoutesContainer: React.FC = () => {
  const { user } = useAuth(); // Used for the final fallback redirect
  return (
    <ProtectedLayoutWrapper>
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/home" />} />
        <Route path="/home" component={HomePage} />
        <Route path="/matches/:matchId/score" component={ScoringPage} />
        <Route path="/matches" component={MatchesPage} />
        <Route path="/tournaments/new" component={CreateTournamentPage} />
        <Route path="/tournaments/:tournamentId" component={TournamentDetailPage} />
        <Route path="/tournaments" component={TournamentsPage} />
        <Route path="/teams/:teamId" component={TeamDetailsPage} />
        <Route path="/teams" component={MyTeamsPage} />
        <Route path="/stats" component={StatsPage} />
        <Route path="/highlights" component={HighlightsPage} />
        <Route path="/profile/:userId" component={ProfilePage} />
        <Route exact path="/profile" component={ProfilePage} />
        <Route path="/my-teams" component={MyTeamsPage} />
        <Route path="/my-performance" component={MyPerformancePage} />
        <Route path="/my-cricket" component={MyCricketPage} />
        <Route path="/looking" component={LookingPage} />
        <Route path="/start-match/select-teams" component={SelectTeamsPage} />
        
        {/* Fallback for authenticated users if no inner route matches */}
        <Route path="*" render={() => user ? <Redirect to="/home" /> : <Redirect to="/login" />} />
      </Switch>
    </ProtectedLayoutWrapper>
  );
};


// Component to handle the main routing logic
const AppRoutes: React.FC = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-gray-100">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-xl">Loading Application...</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignUpPage} />
      {/* All other routes are handled by ProtectedRoutesContainer which applies the layout and auth */}
      <Route component={ProtectedRoutesContainer} />
    </Switch>
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
