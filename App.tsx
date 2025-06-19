
import React from 'react';
import { HashRouter, Switch, Route, Redirect, useLocation, RouteProps } from 'react-router-dom'; // Updated imports for v5
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

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

// Layout for authenticated users
const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  const location = useLocation();
  const showTabs = pathsToShowMainUITabs.some(p => location.pathname.startsWith(p) || location.pathname === p);

  let mainContentPaddingTopClasses = "pt-[57px] sm:pt-[61px]";
  if (showTabs) {
    mainContentPaddingTopClasses = "pt-[105px] sm:pt-[117px]";
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <AppHeader />
      {showTabs && <MainUITabs />}
      <main className={`flex-grow container mx-auto px-4 pb-4 mb-16 sm:mb-0 ${mainContentPaddingTopClasses}`}>
        {children} {/* Render children passed by PrivateRoute */}
      </main>
      <BottomNav />
    </div>
  );
};

// Custom PrivateRoute component for v5
interface PrivateRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { user, loading: authLoading } = useAuth();

  // Don't render anything if auth is still loading, or handle it differently if needed
  if (authLoading && !user) { 
    return null; // Or a minimal loading indicator
  }

  return (
    <Route
      {...rest}
      render={props =>
        user ? (
          <ProtectedLayout>
            <Component {...props} />
          </ProtectedLayout>
        ) : (
          <Redirect to={{ pathname: "/login", state: { from: props.location } }} />
        )
      }
    />
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
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignUpPage} />

      {/* Protected Routes using PrivateRoute */}
      <PrivateRoute exact path="/" component={() => <Redirect to="/home" />} />
      <PrivateRoute path="/home" component={HomePage} />
      <PrivateRoute exact path="/matches" component={MatchesPage} />
      <PrivateRoute path="/matches/:matchId/score" component={ScoringPage} />
      <PrivateRoute exact path="/tournaments" component={TournamentsPage} />
      <PrivateRoute path="/tournaments/new" component={CreateTournamentPage} />
      <PrivateRoute path="/tournaments/:tournamentId" component={TournamentDetailPage} />
      <PrivateRoute path="/teams/:teamId" component={TeamDetailsPage} />
      <PrivateRoute path="/teams" component={MyTeamsPage} /> {/* Covers /my-teams effectively */}
      <PrivateRoute path="/stats" component={StatsPage} />
      <PrivateRoute path="/highlights" component={HighlightsPage} />
      
      <PrivateRoute path="/profile/:userId" component={ProfilePage} />
      <PrivateRoute exact path="/profile" component={ProfilePage} />
        
      {/* Retained /my-teams for explicit linking if needed, but /teams is the primary for the tab */}
      <PrivateRoute path="/my-teams" component={MyTeamsPage} /> 
      <PrivateRoute path="/my-performance" component={MyPerformancePage} />
      <PrivateRoute path="/my-cricket" component={MyCricketPage} />
      <PrivateRoute path="/looking" component={LookingPage} />
      
      {/* Fallback for authenticated users if no other protected route matches */}
      <Route path="*">
        {user ? <Redirect to="/home" /> : <Redirect to="/login" />}
      </Route>
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
