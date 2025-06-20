
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import CoinTossModal from '../components/CoinTossModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useMatchContext } from '../contexts/MatchContext';
import { Match, Team, MatchFormat } from '../types';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Timestamp } from '../services/firebaseClient'; // Import Timestamp

const TossPage: React.FC = () => {
  const [isCoinModalOpen, setIsCoinModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId: paramMatchId } = useParams<{ matchId?: string }>();
  const context = useMatchContext();

  // State for new immediate match (Mode 1)
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [matchSettings, setMatchSettings] = useState<Partial<Pick<Match, 'venue' | 'format' | 'overs_per_innings' | 'date'>>>({});

  // State for existing upcoming match (Mode 2)
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
        const { teamA: stateTeamA, teamB: stateTeamB, matchSettings: stateMatchSettings } = location.state || {};
        if (stateTeamA && stateTeamB && stateMatchSettings) {
          setTeamA(stateTeamA);
          setTeamB(stateTeamB);
          setMatchSettings(stateMatchSettings);
          setTossWinnerName(stateTeamA.name); // Default toss winner selection
        } else {
          setError("Required team information for a new match is missing.");
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
            setTeamA({ 
                id: 'teamA_placeholder', 
                name: loadedMatch.teamAName, 
                players: loadedMatch.teamASquad || [], 
                createdAt: Timestamp.now(), // Use Timestamp.now()
                user_id: loadedMatch.user_id || '' // Add user_id
            });
            setTeamB({ 
                id: 'teamB_placeholder', 
                name: loadedMatch.teamBName, 
                players: loadedMatch.teamBSquad || [], 
                createdAt: Timestamp.now(), // Use Timestamp.now()
                user_id: loadedMatch.user_id || '' // Add user_id
            });
            setTossWinnerName(loadedMatch.teamAName); // Default
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
    setPageLoading(true);
    setError(null);

    try {
      if (mode === 'newMatch' && teamA && teamB && matchSettings) {
        const matchDataForCreation: Partial<Match> & { tossWinnerName: string, electedTo: "Bat" | "Bowl" } = {
          teamAName: teamA.name,
          teamBName: teamB.name,
          teamASquad: teamA.players,
          teamBSquad: teamB.players,
          venue: matchSettings.venue || "Local Ground",
          format: matchSettings.format || MatchFormat.T20,
          overs_per_innings: matchSettings.overs_per_innings || 20,
          date: new Date().toISOString(), // Match is now
          status: "Live", // Will be handled by startNewMatch
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

  const currentTeamAName = mode === 'newMatch' ? teamA?.name : existingMatchDetails?.teamAName;
  const currentTeamBName = mode === 'newMatch' ? teamB?.name : existingMatchDetails?.teamBName;

  if (pageLoading && !error) { // Show loading only if no error yet
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

  if (!currentTeamAName || !currentTeamBName) { // Should be caught by error above, but as a safeguard
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
                onClick={() => navigate(mode === 'newMatch' ? '/start-match/select-teams' : `/matches`, {state: mode === 'newMatch' ? { mode: 'startNow' } : undefined, replace: true})} 
                aria-label="Go back" 
                className="p-2 mr-4 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">Match Toss</h1>
            </div>
        </header>

        <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700 mt-20">
          <h2 className="text-2xl font-bold text-center mb-6">Who Won the Toss?</h2>
          
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
              {currentTeamAName && <option value={currentTeamAName}>{currentTeamAName}</option>}
              {currentTeamBName && <option value={currentTeamBName}>{currentTeamBName}</option>}
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
            disabled={!tossWinnerName || !electedTo || pageLoading} 
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
            // Note: Visual toss doesn't dictate winner, user selects winner above
        }}
      />
    </>
  );
};

export default TossPage;
