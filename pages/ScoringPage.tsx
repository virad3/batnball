
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Match, BallEvent, Score } from '../types';
import { getMatchById, updateMatch } from '../services/dataService'; // Added updateMatch
import ScoreDisplay from '../components/ScoreDisplay';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMatchContext } from '../contexts/MatchContext';
// import { generateCommentaryForBall } from '../services/geminiService'; // Uncomment if using Gemini

const RunsButton: React.FC<{ runs: number; onClick: (runs: number) => void }> = ({ runs, onClick }) => (
  <Button
    variant="outline"
    className="w-full aspect-square text-xl font-semibold" 
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
    innings1, innings2, currentInnings, battingTeamName, bowlingTeamName, target
  } = useMatchContext();

  const [loading, setLoading] = useState(true);
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinnerNameState, setTossWinnerNameState] = useState<string | null>(null);
  const [electedToState, setElectedToState] = useState<"Bat" | "Bowl" | null>(null);
  // const [lastCommentary, setLastCommentary] = useState<string | null>(null); // For Gemini

  useEffect(() => {
    const initPage = async () => {
        setLoading(true);
        if (matchId && matchId !== "newmatch") {
            // Check context first
            if (matchDetails && matchDetails.id === matchId) {
                if (matchDetails.status === "Upcoming" && !battingTeamName && !matchDetails.tossWinnerName) {
                    setTossWinnerNameState(matchDetails.teamAName);
                    setShowTossModal(true);
                }
                setLoading(false);
                return;
            }
            // Fetch if not in context or different match
            try {
                const fetchedMatch = await getMatchById(matchId);
                if (fetchedMatch) {
                    contextSetMatchDetails(fetchedMatch);
                    if (fetchedMatch.status === "Upcoming" && !fetchedMatch.tossWinnerName) {
                        setTossWinnerNameState(fetchedMatch.teamAName);
                        setShowTossModal(true);
                    } else if (fetchedMatch.status !== "Upcoming" && !battingTeamName && fetchedMatch.tossWinnerName && fetchedMatch.electedTo) {
                        // If match is live/completed but context not set, initialize context from fetched details
                        contextStartMatch(fetchedMatch.id, fetchedMatch.tossWinnerName, fetchedMatch.electedTo, fetchedMatch);
                    }
                } else {
                    navigate('/matches');
                }
            } catch (error) {
                console.error("Failed to fetch match details:", error);
                navigate('/matches');
            }
        } else if (matchId === "newmatch") {
            // Check if context has a temp match already, otherwise create one
            if (!matchDetails || !matchDetails.id.startsWith("temp-")) {
                const tempMatch: Match = {
                    id: `temp-${Date.now()}`,
                    teamAName: "Team A", 
                    teamBName: "Team B",
                    date: new Date().toISOString(),
                    venue: "Local Ground",
                    format: "T20" as any, 
                    status: "Upcoming",
                    overs: 20,
                };
                contextSetMatchDetails(tempMatch);
                setTossWinnerNameState(tempMatch.teamAName);
            } else {
                 setTossWinnerNameState(matchDetails.teamAName); // use existing temp match details
            }
            setShowTossModal(true);
        } else if (matchDetails && matchDetails.status === "Upcoming" && !battingTeamName && !matchDetails.tossWinnerName) {
            // Existing match in context is upcoming and needs toss
            setTossWinnerNameState(matchDetails.teamAName);
            setShowTossModal(true);
        }
        setLoading(false);
    };
    initPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, contextSetMatchDetails, navigate]); // Removed matchDetails, battingTeamName to avoid loops with context updates


  const handleStartMatch = async () => {
    if (matchDetails && tossWinnerNameState && electedToState) {
      const matchToStart = {...matchDetails, tossWinnerName: tossWinnerNameState, electedTo: electedToState, status: "Live" as "Live"};
      contextStartMatch(matchToStart.id, tossWinnerNameState, electedToState, matchToStart);
      
      // Persist toss decision for non-new matches
      if (matchId !== "newmatch") {
          try {
              await updateMatch(matchToStart);
          } catch (error) {
              console.error("Failed to update match with toss details:", error);
              // Potentially show an error to the user
          }
      }
      setShowTossModal(false);
    }
  };

  const handleBallEvent = async (runs: number, isWicket: boolean = false, extraType?: BallEvent['extraType'], extraRuns?: number) => {
    if (!battingTeamName || !bowlingTeamName || !matchDetails) return;

    const ballEvent: BallEvent = {
      runs,
      isWicket,
      extraType,
      extraRuns,
    };
    contextAddBall(ballEvent);
  };
  
  const currentMatchInnings = currentInnings === 1 ? innings1 : innings2;
  
  const scoreForDisplay: Score | null = currentMatchInnings && battingTeamName && bowlingTeamName ? {
      runs: currentMatchInnings.score,
      wickets: currentMatchInnings.wickets,
      overs: currentMatchInnings.overs,
      ballsThisOver: currentMatchInnings.balls % 6,
      battingTeamName: battingTeamName,
      bowlingTeamName: bowlingTeamName,
  } : null;

  const handleCloseTossModal = () => {
    setShowTossModal(false);
    if (matchId === "newmatch") {
        navigate('/matches');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!matchDetails) return <div className="text-center p-8 text-xl text-gray-300">Match details not loaded. <Link to="/matches" className="text-slate-400 hover:underline">Go to Matches</Link></div>;

  if (showTossModal && matchDetails) {
    const inputClass = "w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-100 placeholder-gray-400"; // Updated focus ring
    const labelClass = "block text-sm font-medium text-gray-200 mb-1";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="relative bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <button
            onClick={handleCloseTossModal}
            aria-label="Close toss modal"
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-50 mb-6 text-center">Match Toss</h2>
          {matchId === "newmatch" && (
            <div className="mb-4 space-y-3">
                 <div>
                    <label htmlFor="teamAName" className={labelClass}>Team A Name:</label>
                    <input type="text" id="teamAName" value={matchDetails.teamAName} 
                            onChange={(e) => contextSetMatchDetails({...matchDetails, teamAName: e.target.value, ...(tossWinnerNameState === matchDetails.teamAName && { tossWinnerNameState: e.target.value}) })} 
                            className={inputClass}/>
                 </div>
                 <div>
                    <label htmlFor="teamBName" className={labelClass}>Team B Name:</label>
                    <input type="text" id="teamBName" value={matchDetails.teamBName} 
                            onChange={(e) => contextSetMatchDetails({...matchDetails, teamBName: e.target.value, ...(tossWinnerNameState === matchDetails.teamBName && { tossWinnerNameState: e.target.value})})}
                            className={inputClass}/>
                 </div>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="tossWinner" className={labelClass}>Toss Won By:</label>
            <select
              id="tossWinner"
              value={tossWinnerNameState || ''}
              onChange={(e) => setTossWinnerNameState(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled className="text-gray-500">Select Team</option>
              {matchDetails.teamAName && <option value={matchDetails.teamAName}>{matchDetails.teamAName}</option>}
              {matchDetails.teamBName && <option value={matchDetails.teamBName}>{matchDetails.teamBName}</option>}
            </select>
          </div>
          <div className="mb-6">
            <label className={labelClass}>Elected To:</label>
            <div className="flex space-x-4">
              <Button variant={electedToState === "Bat" ? "primary" : "outline"} onClick={() => setElectedToState("Bat")} className="flex-1">Bat</Button>
              <Button variant={electedToState === "Bowl" ? "primary" : "outline"} onClick={() => setElectedToState("Bowl")} className="flex-1">Bowl</Button>
            </div>
          </div>
          <Button onClick={handleStartMatch} disabled={!tossWinnerNameState || !electedToState || !matchDetails.teamAName || !matchDetails.teamBName} className="w-full" variant="primary" size="lg">
            Start Match
          </Button>
        </div>
      </div>
    );
  }
  
  if (!battingTeamName || !bowlingTeamName) {
     return (
        <div className="text-center p-8 text-xl text-gray-300">
            <p className="mb-3">Match setup incomplete.</p>
            {matchDetails.status === "Upcoming" && <Button onClick={() => { setTossWinnerNameState(matchDetails.teamAName); setShowTossModal(true);}} className="mt-2" variant="primary">Complete Toss</Button>}
            {matchDetails.status !== "Upcoming" && !matchDetails.tossWinnerName && <p className="text-yellow-400 text-sm mt-2">Toss details missing for this match. You might need to edit the match or start over if it's an error.</p>}
            <Link to="/matches" className="block mt-4 text-slate-400 hover:underline">Go to Matches</Link>
        </div>
     );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-50 text-center">
        {matchDetails.teamAName} vs {matchDetails.teamBName}
      </h1>
      
      <ScoreDisplay score={scoreForDisplay} target={target} currentInnings={currentInnings} totalOvers={matchDetails.overs} />

      <div className="p-4 bg-gray-800 rounded-lg shadow space-y-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100">Scoring Controls:</h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(r => <RunsButton key={r} runs={r} onClick={() => handleBallEvent(r)} />)}
          <Button variant="danger" className="w-full aspect-square text-lg font-semibold" onClick={() => handleBallEvent(0, true)}>WKT</Button>
        </div>
        <div className="flex space-x-2">
            {(["Wide", "NoBall", "Byes", "LegByes"] as BallEvent['extraType'][]).map(type => 
                <ExtraButton key={type} type={type} onClick={() => {
                    const extraRunsValue = type === "Wide" || type === "NoBall" ? 1 : 0;
                    handleBallEvent(0, false, type, extraRunsValue);
                }} />
            )}
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Match Actions:</h3>
          {currentInnings === 1 && currentMatchInnings && (currentMatchInnings.wickets >= 10 || (matchDetails.overs && currentMatchInnings.overs >= matchDetails.overs && currentMatchInnings.balls % 6 === 0 && currentMatchInnings.balls > 0) ) && (
            <Button onClick={contextSwitchInnings} variant="primary" className="w-full mb-3">End Innings & Start 2nd Innings</Button>
          )}
          <Button onClick={() => navigate('/matches')} variant="outline" className="w-full">Back to Matches</Button>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow mt-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Recent Events:</h3>
        {/* {lastCommentary && <p className="text-sm italic text-blue-300 mb-2 p-2 bg-blue-900 bg-opacity-50 rounded">{lastCommentary}</p>} */}
        <ul className="text-sm space-y-1.5 text-gray-300 max-h-40 overflow-y-auto pr-2">
            {currentMatchInnings?.timeline?.slice(-5).reverse().map((event, idx) => (
                <li key={idx} className="border-b border-gray-700 pb-1.5 text-gray-300">
                   {event.isWicket ? <span className="font-semibold text-red-400">WICKET!</span> : `${event.runs} run(s)`}
                   {event.extraType && <span className="text-yellow-400"> ({event.extraType}{event.extraRuns ? ` +${event.extraRuns}` : ''})</span>}
                </li>
            ))}
            {currentMatchInnings?.timeline?.length === 0 && <li className="text-gray-400">No events yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default ScoringPage;
