
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Match, Team, Player, BallEvent, Innings } from '../types';
import { getMatchById, mockPlayers, mockTeams } from '../services/dataService'; // Assuming getMatchById exists
import ScoreDisplay from '../components/ScoreDisplay';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMatchContext } from '../contexts/MatchContext';
import { COLORS } from '../constants';


const RunsButton: React.FC<{ runs: number; onClick: (runs: number) => void }> = ({ runs, onClick }) => (
  <Button
    variant="outline"
    className="w-full aspect-square text-xl"
    onClick={() => onClick(runs)}
  >
    {runs}
  </Button>
);

const ExtraButton: React.FC<{ type: BallEvent['extraType']; onClick: (type: BallEvent['extraType']) => void }> = ({ type, onClick }) => (
    <Button
        variant="secondary"
        size="sm"
        className="flex-1"
        onClick={() => onClick(type)}
    >
        {type}
    </Button>
);


const ScoringPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const {
    matchDetails, setMatchDetails: contextSetMatchDetails,
    startMatch: contextStartMatch, addBall: contextAddBall, switchInnings: contextSwitchInnings,
    innings1, innings2, currentInnings, battingTeam, bowlingTeam, striker, nonStriker, bowler, target
  } = useMatchContext();

  const [loading, setLoading] = useState(true);
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState<Team | null>(null);
  const [electedTo, setElectedTo] = useState<"Bat" | "Bowl" | null>(null);

  useEffect(() => {
    if (matchId && matchId !== "newmatch" && !matchDetails) { // "newmatch" is a placeholder for starting a new unscored match
      const fetchMatch = async () => {
        setLoading(true);
        try {
          const fetchedMatch = await getMatchById(matchId); // You'll need to implement this
          if (fetchedMatch) {
            contextSetMatchDetails(fetchedMatch);
            if (fetchedMatch.status === "Upcoming") {
                setShowTossModal(true);
                setTossWinner(fetchedMatch.teamA); // Default for selection
            } else if (fetchedMatch.status === "Live" && (!innings1 || (currentInnings === 2 && !innings2))) {
                // TODO: Logic to resume match if data exists (e.g. from local storage or backend)
                // For now, if live but no context, assume we need to start it (could be problematic)
                // This part needs robust state restoration logic for real app
                // For this example, we'll assume if it's Live and we don't have innings data, we start it from toss.
                // This is a simplification.
                if (!battingTeam) { // Only show toss if no teams are set up yet
                    setShowTossModal(true);
                    setTossWinner(fetchedMatch.teamA);
                }
            }
          } else {
            // Handle match not found
            navigate('/matches');
          }
        } catch (error) {
          console.error("Failed to fetch match details:", error);
          navigate('/matches');
        } finally {
          setLoading(false);
        }
      };
      fetchMatch();
    } else if (matchId === "newmatch" && !matchDetails) {
        // Create a temporary new match object
        const tempMatch: Match = {
            id: `temp-${Date.now()}`,
            teamA: mockTeams[0], // Or allow team selection
            teamB: mockTeams[1],
            date: new Date().toISOString(),
            venue: "Local Ground",
            format: "T20" as any, // Cast to any to satisfy MatchFormat enum if "T20" is part of it.
            status: "Upcoming",
        };
        contextSetMatchDetails(tempMatch);
        setShowTossModal(true);
        setTossWinner(tempMatch.teamA);
        setLoading(false);
    }
     else {
      setLoading(false);
       if(matchDetails?.status === "Upcoming" && !battingTeam) { // If details loaded but match not started
          setShowTossModal(true);
          setTossWinner(matchDetails.teamA);
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, contextSetMatchDetails, navigate, matchDetails]);


  const handleStartMatch = () => {
    if (matchDetails && tossWinner && electedTo) {
      contextStartMatch(matchDetails.id, tossWinner, electedTo, matchDetails);
      setShowTossModal(false);
    }
  };

  const handleBallEvent = (runs: number, isWicket: boolean = false, extraType?: BallEvent['extraType'], extraRuns?: number) => {
    if (!striker || !bowler || !matchDetails) return; // Ensure players are selected

    const ballEvent: BallEvent = {
      runs,
      isWicket,
      extraType,
      extraRuns,
      batsman: striker, // This would be more complex, assigning runs to correct batsman
      bowler: bowler,
      // TODO: wicketType, fielder if wicket
    };
    contextAddBall(ballEvent);

    // Placeholder for Gemini commentary
    // generateCommentaryForBall(ballEvent); 
  };
  
  const currentMatchScore = currentInnings === 1 ? innings1 : innings2;

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!matchDetails) return <div className="text-center p-8 text-xl">Match details not loaded. <Link to="/matches" className="text-[#d32f2f] hover:underline">Go to Matches</Link></div>;

  if (showTossModal && matchDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-[#004d40] mb-6 text-center">Match Toss</h2>
          <div className="mb-4">
            <label htmlFor="tossWinner" className="block text-sm font-medium text-gray-700 mb-1">Toss Won By:</label>
            <select
              id="tossWinner"
              value={tossWinner?.id || ''}
              onChange={(e) => setTossWinner(e.target.value === matchDetails.teamA.id ? matchDetails.teamA : matchDetails.teamB)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#004d40] focus:border-[#004d40]"
            >
              <option value="" disabled>Select Team</option>
              <option value={matchDetails.teamA.id}>{matchDetails.teamA.name}</option>
              <option value={matchDetails.teamB.id}>{matchDetails.teamB.name}</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Elected To:</label>
            <div className="flex space-x-4">
              <Button variant={electedTo === "Bat" ? "primary" : "outline"} onClick={() => setElectedTo("Bat")} className="flex-1">Bat</Button>
              <Button variant={electedTo === "Bowl" ? "primary" : "outline"} onClick={() => setElectedTo("Bowl")} className="flex-1">Bowl</Button>
            </div>
          </div>
          <Button onClick={handleStartMatch} disabled={!tossWinner || !electedTo} className="w-full" variant="primary">
            Start Match
          </Button>
        </div>
      </div>
    );
  }
  
  if (!battingTeam || !bowlingTeam) {
     return <div className="text-center p-8 text-xl text-[#004d40]">Match not started. Waiting for toss information...</div>;
  }
  
  const scoreForDisplay: any = {
      runs: currentMatchScore?.score || 0,
      wickets: currentMatchScore?.wickets || 0,
      overs: currentMatchScore?.overs || 0,
      ballsThisOver: (currentMatchScore?.balls || 0) % 6,
      battingTeam: battingTeam,
      bowlingTeam: bowlingTeam,
      currentStriker: striker,
      currentNonStriker: nonStriker,
      currentBowler: bowler,
  };


  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-[#004d40] text-center">
        {matchDetails.teamA.name} vs {matchDetails.teamB.name}
      </h1>
      
      <ScoreDisplay score={scoreForDisplay} target={target} currentInnings={currentInnings} />

      <div className="p-4 bg-white rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold text-[#004d40]">Scoring Controls:</h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(r => <RunsButton key={r} runs={r} onClick={() => handleBallEvent(r)} />)}
          <Button variant="danger" className="w-full aspect-square text-lg" onClick={() => handleBallEvent(0, true)}>WKT</Button>
        </div>
        <div className="flex space-x-2">
            {(["Wide", "NoBall", "Byes", "LegByes"] as BallEvent['extraType'][]).map(type => 
                <ExtraButton key={type} type={type} onClick={() => {
                    const extraRunsValue = type === "Wide" || type === "NoBall" ? 1 : 0; // Common default
                    // In a real app, you'd prompt for runs if Byes/LegByes or NoBall + runs
                    handleBallEvent(0, false, type, extraRunsValue);
                }} />
            )}
        </div>
         {/* TODO: Add player selection for striker, non-striker, bowler. For now, using defaults. */}
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-[#004d40] mb-2">Match Actions:</h3>
          {currentInnings === 1 && (currentMatchScore?.wickets === 10 || currentMatchScore?.overs === (matchDetails.overs || 20) ) && (
            <Button onClick={contextSwitchInnings} variant="primary" className="w-full mb-2">End Innings & Start 2nd Innings</Button>
          )}
          {/* TODO: Add declare innings, end match options */}
          <Button onClick={() => navigate('/matches')} variant="outline" className="w-full">Back to Matches</Button>
      </div>

      {/* Placeholder for timeline/commentary */}
      <div className="p-4 bg-white rounded-lg shadow mt-4">
        <h3 className="text-lg font-semibold text-[#004d40] mb-2">Recent Events:</h3>
        <ul className="text-sm space-y-1 text-gray-700 max-h-40 overflow-y-auto">
            {currentMatchScore?.timeline?.slice(-5).reverse().map((event, idx) => (
                <li key={idx} className="border-b border-gray-200 pb-1">
                   {`${event.batsman?.name || 'Batsman'} faced ${event.bowler?.name || 'Bowler'}: `}
                   {event.isWicket ? 'WICKET!' : `${event.runs} run(s)`}
                   {event.extraType && ` (${event.extraType}${event.extraRuns ? `+${event.extraRuns}` : ''})`}
                </li>
            ))}
            {currentMatchScore?.timeline?.length === 0 && <li>No events yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default ScoringPage;
