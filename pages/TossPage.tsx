
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import CoinTossModal from '../components/CoinTossModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useMatchContext } from '../contexts/MatchContext';
import { Match, MatchFormat } from '../types';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
// Timestamp is not directly used here, can be removed if not needed for other logic
// import { Timestamp } from '../services/firebaseClient';

const DEFAULT_OVERS = 20;

const TossPage: React.FC = () => {
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId: paramMatchId } = useParams<{ matchId?: string }>();
  const context = useMatchContext();

  // State for new immediate match (Mode 1 - 'newMatch')
  const [teamAName, setTeamAName] = useState<string | null>(null);
  const [teamBName, setTeamBName] = useState<string | null>(null);
  const [teamASquad, setTeamASquad] = useState<string[]>([]);
  const [teamBSquad, setTeamBSquad] = useState<string[]>([]);
  const [matchSettingsFromPrevPage, setMatchSettingsFromPrevPage] = useState<Partial<Pick<Match, 'venue' | 'format' | 'overs_per_innings' | 'date'>>>({});
  const [localMatchOvers, setLocalMatchOvers] = useState<number>(DEFAULT_OVERS);

  // State for existing upcoming match (Mode 2 - 'existingMatch')
  const [existingMatchDetails, setExistingMatchDetails] = useState<Match | null>(null);

  // General toss decision state
  const [tossWinnerName, setTossWinnerName] = useState<string | null>(null);
  const [electedTo, setElectedTo] = useState<"Bat" | "Bowl" | null>(null);

  const mode = paramMatchId ? 'existingMatch' : (location.state?.mode === 'startNow' ? 'newMatch' : 'invalid');

  useEffect(() => {
    const initialize = async () => {
      setPageLoading(true);
      setError(null);
      if (mode === 'newMatch') {
        const { 
          teamAName: stateTeamAName, 
          teamBName: stateTeamBName, 
          teamASquad: stateTeamASquad,
          teamBSquad: stateTeamBSquad,
          matchSettings // Renamed to avoid conflict
        } = location.state || {};
        
        if (stateTeamAName && stateTeamBName && stateTeamASquad && stateTeamBSquad && matchSettings) {
          setTeamAName(stateTeamAName);
          setTeamBName(stateTeamBName);
          setTeamASquad(stateTeamASquad);
          setTeamBSquad(stateTeamBSquad);
          setMatchSettingsFromPrevPage(matchSettings);
          setTossWinnerName(stateTeamAName); 
          // Initialize localMatchOvers from previous page settings or default
          setLocalMatchOvers(matchSettings.overs_per_innings !== undefined && matchSettings.overs_per_innings !== null ? matchSettings.overs_per_innings : DEFAULT_OVERS);
        } else {
          setError("Required team and squad information for a new match is missing.");
          navigate('/home', {replace: true});
        }
      } else if (mode === 'existingMatch' && paramMatchId) {
        const loadedMatch = await context.loadMatch(paramMatchId);
        if (loadedMatch) {
          if (loadedMatch.status !== "Upcoming" || loadedMatch.tossWinnerName) {
            setError("This match is not upcoming or toss has already been decided. Redirecting...");
            setTimeout(() => navigate(`/matches/${paramMatchId}/score`, {replace: true}), 2000);
          } else {
            setExistingMatchDetails(loadedMatch);
            setTeamAName(loadedMatch.teamAName); 
            setTeamBName(loadedMatch.teamBName);
            setTossWinnerName(loadedMatch.teamAName); 
            // For existing matches, overs_per_innings is from DB, no localMatchOvers input needed
          }
        } else {
          setError("Failed to load match details.");
           setTimeout(() => navigate('/matches', {replace: true}), 2000);
        }
      } else {
         setError("Invalid page access. Redirecting...");
         setTimeout(() => navigate('/home', {replace: true}), 2000);
      }
      setPageLoading(false);
    };
    initialize();
  }, [mode, paramMatchId, location.state, context.loadMatch, navigate]);

  const handleStartMatchWithToss = async () => {
    if (!tossWinnerName || !electedTo) {
      setError("Please select the toss winner and their decision.");
      return;
    }
    
    // Validate overs for new match, if not a Test match
    const currentFormat = mode === 'newMatch' ? matchSettingsFromPrevPage.format : existingMatchDetails?.format;
    if (mode === 'newMatch' && currentFormat !== MatchFormat.TEST && localMatchOvers <=0) {
        setError("Number of overs must be greater than 0 for this format.");
        return;
    }

    setPageLoading(true);
    setError(null);

    try {
      if (mode === 'newMatch' && teamAName && teamBName && teamASquad.length > 0 && teamBSquad.length > 0 && matchSettingsFromPrevPage) {
        const matchDataForCreation: Partial<Match> & { tossWinnerName: string, electedTo: "Bat" | "Bowl" } = {
          teamAName: teamAName,
          teamBName: teamBName,
          teamASquad: teamASquad, 
          teamBSquad: teamBSquad, 
          venue: matchSettingsFromPrevPage.venue || "Local Ground",
          format: matchSettingsFromPrevPage.format || MatchFormat.T20,
          // Use localMatchOvers for new matches, unless it's a Test match
          overs_per_innings: matchSettingsFromPrevPage.format === MatchFormat.TEST ? undefined : localMatchOvers,
          date: new Date().toISOString(), 
          status: "Live", 
          tossWinnerName: tossWinnerName,
          electedTo: electedTo,
        };
        const newMatch = await context.startNewMatch(matchDataForCreation);
        if (newMatch && newMatch.id) {
          navigate(`/matches/${newMatch.id}/score`, { replace: true });
        } else {
          throw new Error("Failed to create and start the new match.");
        }
      } else if (mode === 'existingMatch' && existingMatchDetails && paramMatchId) {
        // For existing matches, overs_per_innings is already set and will be used by updateTossAndStartInnings
        await context.updateTossAndStartInnings(tossWinnerName, electedTo);
        navigate(`/matches/${paramMatchId}/score`, { replace: true });
      } else {
        throw new Error("Match details are incomplete for starting the match.");
      }
    } catch (err: any) {
      console.error("Error starting match with toss:", err);
      setError(err.message || "Could not start the match.");
      setPageLoading(false);
    }
  };

  const currentDisplayTeamAName = mode === 'newMatch' ? teamAName : existingMatchDetails?.teamAName;
  const currentDisplayTeamBName = mode === 'newMatch' ? teamBName : existingMatchDetails?.teamBName;
  const currentMatchFormat = mode === 'newMatch' ? matchSettingsFromPrevPage.format : existingMatchDetails?.format;

  if (pageLoading && !error) { 
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 mt-4 text-lg">Loading Toss Setup...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
            <p className="text-red-400 text-xl mb-6">{error}</p>
            <Button onClick={() => navigate('/home', {replace: true})} variant="primary">Go Home</Button>
        </div>
    );
  }

  if (!currentDisplayTeamAName || !currentDisplayTeamBName) {
     return <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4"><p className="text-red-400">Team information missing.</p></div>;
  }

  const labelClass = "block text-sm font-medium text-gray-300 mb-1";
  const inputClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-100 placeholder-gray-400";

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 space-y-8">
         <header className="fixed top-0 left-0 right-0 bg-gray-800 text-gray-100 p-4 shadow-md z-10 border-b border-gray-700">
            <div className="container mx-auto flex items-center">
            <button 
                onClick={() => navigate(mode === 'newMatch' ? '/start-match/select-teams' : `/matches`, {state: mode === 'newMatch' ? location.state : undefined, replace: true})} 
                aria-label="Go back" 
                className="p-2 mr-4 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Match Toss</h1>
            </div>
        </header>

        <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mt-20">
          <h2 className="text-2xl font-bold text-center mb-6">Toss Details</h2>
          
          {/* Conditional Overs Input for New Match Mode */}
          {mode === 'newMatch' && currentMatchFormat !== MatchFormat.TEST && (
            <div className="mb-4">
              <label htmlFor="localMatchOvers" className={labelClass}>Number of Overs:</label>
              <input
                type="number"
                id="localMatchOvers"
                value={localMatchOvers}
                onChange={(e) => setLocalMatchOvers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                min="1"
                className={inputClass}
                aria-label="Set number of overs for the match"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="tossWinner" className={labelClass}>Toss Won By:</label>
            <select 
                id="tossWinner" 
                value={tossWinnerName || ''} 
                onChange={(e) => setTossWinnerName(e.target.value)} 
                className={inputClass}
                aria-label="Select toss winning team"
            >
              <option value="" disabled>Select Team</option>
              {currentDisplayTeamAName && <option value={currentDisplayTeamAName}>{currentDisplayTeamAName}</option>}
              {currentDisplayTeamBName && <option value={currentDisplayTeamBName}>{currentDisplayTeamBName}</option>}
            </select>
          </div>

          <div className="mb-6">
            <label className={labelClass}>Elected To:</label>
            <div className="flex space-x-4">
              <Button 
                variant={electedTo === "Bat" ? "primary" : "outline"} 
                onClick={() => setElectedTo("Bat")} 
                className="flex-1 text-center"
                aria-pressed={electedTo === "Bat"}
              >
                BAT
              </Button>
              <Button 
                variant={electedTo === "Bowl" ? "primary" : "outline"} 
                onClick={() => setElectedTo("Bowl")} 
                className="flex-1 text-center"
                aria-pressed={electedTo === "Bowl"}
              >
                BOWL
              </Button>
            </div>
          </div>
            
          <Button
            onClick={() => setIsCoinModalOpen(true)}
            variant="secondary"
            className="w-full mb-4"
          >
            Flip Coin (Visual)
          </Button>

          <Button 
            onClick={handleStartMatchWithToss} 
            disabled={!tossWinnerName || !electedTo || pageLoading || (mode === 'newMatch' && currentMatchFormat !== MatchFormat.TEST && localMatchOvers <= 0)} 
            isLoading={pageLoading}
            className="w-full text-lg" 
            variant="primary" 
            size="lg"
          >
            {pageLoading ? 'Starting Match...' : 'Confirm & Start Match'}
          </Button>
        </div>
      </div>
      <CoinTossModal
        isOpen={isCoinModalOpen}
        onClose={() => setIsCoinModalOpen(false)}
        onProceed={() => { 
            setIsCoinModalOpen(false); 
        }}
      />
    </>
  );
};

export default TossPage;
