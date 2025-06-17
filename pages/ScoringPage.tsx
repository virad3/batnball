

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Match, BallEvent, Score, MatchFormat } from '../types';
import { getMatchById, updateMatch } from '../services/dataService'; 
import ScoreDisplay from '../components/ScoreDisplay';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMatchContext } from '../contexts/MatchContext';

const SQUAD_SIZE = 11;

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
  
  const [showSquadSelectionModal, setShowSquadSelectionModal] = useState(false);
  const [availableTeamAPlayers, setAvailableTeamAPlayers] = useState<string[]>([]);
  const [availableTeamBPlayers, setAvailableTeamBPlayers] = useState<string[]>([]);
  const [selectedTeamASquad, setSelectedTeamASquad] = useState<string[]>([]);
  const [selectedTeamBSquad, setSelectedTeamBSquad] = useState<string[]>([]);
  const [newPlayerNameA, setNewPlayerNameA] = useState('');
  const [newPlayerNameB, setNewPlayerNameB] = useState('');


  const initializePage = useCallback(async () => {
    setLoading(true);
    if (matchId && matchId !== "newmatch") {
        if (matchDetails && matchDetails.id === matchId) {
             if (matchDetails.status === "Upcoming" && !battingTeamName && !matchDetails.tossWinnerName) {
                setTossWinnerNameState(matchDetails.teamAName);
                setShowTossModal(true);
            } else if (matchDetails.status === "Live" && battingTeamName && (!matchDetails.teamASquad || matchDetails.teamASquad.length < SQUAD_SIZE || !matchDetails.teamBSquad || matchDetails.teamBSquad.length < SQUAD_SIZE)) {
                // If live and squads are not complete, show squad modal
                setAvailableTeamAPlayers(matchDetails.teamASquad || []);
                setAvailableTeamBPlayers(matchDetails.teamBSquad || []);
                setSelectedTeamASquad(matchDetails.teamASquad || []);
                setSelectedTeamBSquad(matchDetails.teamBSquad || []);
                setShowSquadSelectionModal(true);
            }
            setLoading(false);
            return;
        }
        try {
            const fetchedMatch = await getMatchById(matchId);
            if (fetchedMatch) {
                contextSetMatchDetails(fetchedMatch);
                if (fetchedMatch.status === "Upcoming" && !fetchedMatch.tossWinnerName) {
                    setTossWinnerNameState(fetchedMatch.teamAName);
                    setShowTossModal(true);
                } else if (fetchedMatch.status !== "Upcoming" && !battingTeamName && fetchedMatch.tossWinnerName && fetchedMatch.electedTo) {
                    contextStartMatch(fetchedMatch.id, fetchedMatch.tossWinnerName, fetchedMatch.electedTo, fetchedMatch);
                    // Check for squad selection after starting context match
                    if (!fetchedMatch.teamASquad || fetchedMatch.teamASquad.length < SQUAD_SIZE || !fetchedMatch.teamBSquad || fetchedMatch.teamBSquad.length < SQUAD_SIZE) {
                        setAvailableTeamAPlayers(fetchedMatch.teamASquad || []);
                        setAvailableTeamBPlayers(fetchedMatch.teamBSquad || []);
                        setSelectedTeamASquad(fetchedMatch.teamASquad || []);
                        setSelectedTeamBSquad(fetchedMatch.teamBSquad || []);
                        setShowSquadSelectionModal(true);
                    }
                } else if (fetchedMatch.status === "Live" && battingTeamName && (!fetchedMatch.teamASquad || fetchedMatch.teamASquad.length < SQUAD_SIZE || !fetchedMatch.teamBSquad || fetchedMatch.teamBSquad.length < SQUAD_SIZE)) {
                     setAvailableTeamAPlayers(fetchedMatch.teamASquad || []);
                     setAvailableTeamBPlayers(fetchedMatch.teamBSquad || []);
                     setSelectedTeamASquad(fetchedMatch.teamASquad || []);
                     setSelectedTeamBSquad(fetchedMatch.teamBSquad || []);
                     setShowSquadSelectionModal(true);
                }
            } else {
                navigate('/matches');
            }
        } catch (error) {
            console.error("Failed to fetch match details:", error);
            navigate('/matches');
        }
    } else if (matchId === "newmatch") {
        const tempMatchData = matchDetails && matchDetails.id.startsWith("temp-") ? matchDetails : {
            id: `temp-${Date.now()}`,
            teamAName: "Team A", 
            teamBName: "Team B",
            date: new Date().toISOString(),
            venue: "Local Ground",
            format: MatchFormat.T20, 
            status: "Upcoming",
            overs: 20,
            teamASquad: [],
            teamBSquad: [],
        };
        contextSetMatchDetails(tempMatchData as Match);
        setTossWinnerNameState(tempMatchData.teamAName);
        setShowTossModal(true);
        // Reset squad states for new match
        setAvailableTeamAPlayers([]);
        setAvailableTeamBPlayers([]);
        setSelectedTeamASquad([]);
        setSelectedTeamBSquad([]);

    } else if (matchDetails && matchDetails.status === "Upcoming" && !battingTeamName && !matchDetails.tossWinnerName) {
        setTossWinnerNameState(matchDetails.teamAName);
        setShowTossModal(true);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, contextSetMatchDetails, navigate]); // Removed matchDetails, battingTeamName etc to avoid loops

  useEffect(() => {
    initializePage();
  }, [initializePage]);


  const handleStartMatch = async () => {
    if (matchDetails && tossWinnerNameState && electedToState) {
      let matchToStart: Match = {
        ...matchDetails, 
        tossWinnerName: tossWinnerNameState, 
        electedTo: electedToState, 
        status: "Live"
      };
      
      try {
          const savedMatch = await updateMatch(matchToStart); 
          matchToStart = savedMatch; 
          contextSetMatchDetails(matchToStart); 
          contextStartMatch(matchToStart.id, tossWinnerNameState, electedToState, matchToStart);
          setShowTossModal(false);

          if (!matchToStart.teamASquad || matchToStart.teamASquad.length < SQUAD_SIZE || !matchToStart.teamBSquad || matchToStart.teamBSquad.length < SQUAD_SIZE) {
            setAvailableTeamAPlayers(matchToStart.teamASquad || []);
            setAvailableTeamBPlayers(matchToStart.teamBSquad || []);
            setSelectedTeamASquad(matchToStart.teamASquad || []);
            setSelectedTeamBSquad(matchToStart.teamBSquad || []);
            setShowSquadSelectionModal(true);
          }
      } catch (error) {
          console.error("Failed to update match with toss details:", error);
      }
    }
  };

  const handleBallEvent = async (runs: number, isWicket: boolean = false, extraType?: BallEvent['extraType'], extraRuns?: number) => {
    if (!battingTeamName || !bowlingTeamName || !matchDetails) return;
    const ballEvent: BallEvent = { runs, isWicket, extraType, extraRuns };
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
    if (matchId === "newmatch" && (!matchDetails || !matchDetails.status || matchDetails.status === "Upcoming")) {
        navigate('/matches');
    }
  };

  const handleAddPlayer = (team: 'A' | 'B') => {
    if (team === 'A' && newPlayerNameA.trim()) {
      if (!availableTeamAPlayers.includes(newPlayerNameA.trim())) {
        setAvailableTeamAPlayers(prev => [...prev, newPlayerNameA.trim()]);
      }
      setNewPlayerNameA('');
    } else if (team === 'B' && newPlayerNameB.trim()) {
      if (!availableTeamBPlayers.includes(newPlayerNameB.trim())) {
        setAvailableTeamBPlayers(prev => [...prev, newPlayerNameB.trim()]);
      }
      setNewPlayerNameB('');
    }
  };

  const handleSquadPlayerSelection = (playerName: string, team: 'A' | 'B') => {
    if (team === 'A') {
      setSelectedTeamASquad(prev => 
        prev.includes(playerName) ? prev.filter(p => p !== playerName) : [...prev, playerName]
      );
    } else {
      setSelectedTeamBSquad(prev =>
        prev.includes(playerName) ? prev.filter(p => p !== playerName) : [...prev, playerName]
      );
    }
  };

  const handleConfirmSquads = async () => {
    if (!matchDetails) return;
    if (selectedTeamASquad.length !== SQUAD_SIZE || selectedTeamBSquad.length !== SQUAD_SIZE) {
        alert(`Please select ${SQUAD_SIZE} players for each team.`);
        return;
    }
    const updatedMatchWithSquads = {
        ...matchDetails,
        teamASquad: selectedTeamASquad,
        teamBSquad: selectedTeamBSquad,
    };
    try {
        const savedMatch = await updateMatch(updatedMatchWithSquads);
        contextSetMatchDetails(savedMatch); // Update context with the final match details including squads
        setShowSquadSelectionModal(false);
    } catch (error) {
        console.error("Error saving squads:", error);
        alert("Failed to save squads. Please try again.");
    }
  };

  const renderSquadSelectionSection = (
    teamType: 'A' | 'B',
    teamName: string,
    availablePlayers: string[],
    selectedSquad: string[],
    newPlayerName: string,
    setNewPlayerName: (name: string) => void
  ) => {
    const inputPlayerId = `newPlayerName${teamType}`;
    const teamLabel = teamType === 'A' ? matchDetails?.teamAName : matchDetails?.teamBName;

    return (
      <div className="space-y-3 p-3 border border-gray-600 rounded-md">
        <h3 className="text-lg font-semibold text-gray-100">{teamLabel} Squad ({selectedSquad.length}/{SQUAD_SIZE})</h3>
        <div className="flex space-x-2">
          <input 
            type="text" 
            id={inputPlayerId}
            value={newPlayerName} 
            onChange={(e) => setNewPlayerName(e.target.value)} 
            placeholder="Enter player name" 
            className="flex-grow p-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 placeholder-gray-400 focus:ring-red-500 focus:border-red-500"
          />
          <Button onClick={() => handleAddPlayer(teamType)} variant="secondary" size="sm">Add Player</Button>
        </div>
        {availablePlayers.length > 0 && <p className="text-xs text-gray-400">Select {SQUAD_SIZE} players:</p>}
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {availablePlayers.map(player => (
            <label key={`${teamType}-${player}`} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${selectedSquad.includes(player) ? 'bg-red-700 text-white' : 'bg-gray-700 hover:bg-red-800 text-gray-200'}`}>
              <input 
                type="checkbox" 
                checked={selectedSquad.includes(player)} 
                onChange={() => handleSquadPlayerSelection(player, teamType)}
                disabled={!selectedSquad.includes(player) && selectedSquad.length >= SQUAD_SIZE}
                className="form-checkbox h-4 w-4 text-red-700 border-gray-500 rounded focus:ring-red-500 bg-gray-500 checked:bg-red-700 focus:ring-offset-gray-700"
              />
              <span className="text-sm">{player}</span>
            </label>
          ))}
          {availablePlayers.length === 0 && <p className="text-sm text-gray-400 italic">No players added yet. Use the input above.</p>}
        </div>
      </div>
    );
  };


  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!matchDetails) return <div className="text-center p-8 text-xl text-gray-300">Match details not loaded. <Link to="/matches" className="text-slate-400 hover:underline">Go to Matches</Link></div>;

  if (showTossModal && matchDetails) {
    const inputClass = "w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-100 placeholder-gray-400";
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
            <select id="tossWinner" value={tossWinnerNameState || ''} onChange={(e) => setTossWinnerNameState(e.target.value)} className={inputClass}>
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
            Start Match & Select Squads
          </Button>
        </div>
      </div>
    );
  }

  if (showSquadSelectionModal && matchDetails) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-50 mb-4 text-center">Select Playing XI ({SQUAD_SIZE} Players per Team)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {renderSquadSelectionSection('A', matchDetails.teamAName, availableTeamAPlayers, selectedTeamASquad, newPlayerNameA, setNewPlayerNameA)}
                    {renderSquadSelectionSection('B', matchDetails.teamBName, availableTeamBPlayers, selectedTeamBSquad, newPlayerNameB, setNewPlayerNameB)}
                </div>
                <Button 
                    onClick={handleConfirmSquads} 
                    disabled={selectedTeamASquad.length !== SQUAD_SIZE || selectedTeamBSquad.length !== SQUAD_SIZE}
                    className="w-full" 
                    variant="primary" 
                    size="lg"
                >
                    Confirm Squads & Proceed
                </Button>
                 <Button 
                    onClick={() => { setShowSquadSelectionModal(false); if(matchId === "newmatch") navigate("/matches");}} 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-3"
                >
                    Cancel / Back
                </Button>
            </div>
        </div>
    );
  }
  
  if (!battingTeamName || !bowlingTeamName || !matchDetails.teamASquad || matchDetails.teamASquad.length < SQUAD_SIZE || !matchDetails.teamBSquad || matchDetails.teamBSquad.length < SQUAD_SIZE) {
     return (
        <div className="text-center p-8 text-xl text-gray-300">
            <p className="mb-3">Match setup incomplete.</p>
            {matchDetails.status === "Upcoming" && !matchDetails.tossWinnerName && <Button onClick={() => { setTossWinnerNameState(matchDetails.teamAName); setShowTossModal(true);}} className="mt-2" variant="primary">Complete Toss</Button>}
            {matchDetails.status === "Live" && battingTeamName && (!matchDetails.teamASquad || matchDetails.teamASquad.length < SQUAD_SIZE || !matchDetails.teamBSquad || matchDetails.teamBSquad.length < SQUAD_SIZE) && (
                 <Button onClick={() => {
                     setAvailableTeamAPlayers(matchDetails.teamASquad || []);
                     setAvailableTeamBPlayers(matchDetails.teamBSquad || []);
                     setSelectedTeamASquad(matchDetails.teamASquad || []);
                     setSelectedTeamBSquad(matchDetails.teamBSquad || []);
                     setShowSquadSelectionModal(true);
                 }} className="mt-2" variant="primary">Select Playing XI</Button>
            )}
            <Link to="/matches" className="block mt-4 text-slate-400 hover:underline">Go to Matches</Link>
        </div>
     );
  }

  // ---- Main Scoring Interface ----
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
                    const extraRunsValue = type === "Wide" || type === "NoBall" ? 1 : 0; // Simplified: No Ball runs are separate from the run off the bat.
                    handleBallEvent(type === "Wide" || type === "NoBall" ? 0 : 0, false, type, extraRunsValue);
                }} />
            )}
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Match Actions:</h3>
          {currentInnings === 1 && currentMatchInnings && (currentMatchInnings.wickets >= SQUAD_SIZE -1 || (matchDetails.overs && currentMatchInnings.overs >= matchDetails.overs && currentMatchInnings.balls % 6 === 0 && currentMatchInnings.balls > 0) ) && (
            <Button onClick={contextSwitchInnings} variant="primary" className="w-full mb-3">End Innings & Start 2nd Innings</Button>
          )}
          <Button onClick={() => navigate('/matches')} variant="outline" className="w-full">Back to Matches</Button>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow mt-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Recent Events:</h3>
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