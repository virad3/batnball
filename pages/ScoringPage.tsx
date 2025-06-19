
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // useNavigate for v7
import { Match, BallEvent, Score, MatchFormat, PlayerBattingStats, PlayerBowlingStats, DismissalType, InningsRecord } from '../types';
import ScoreDisplay from '../components/ScoreDisplay';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMatchContext } from '../contexts/MatchContext';

const SQUAD_SIZE = 11;

// Simplified button components, can be enhanced
const RunsButton: React.FC<{ runs: number; onClick: (runs: number) => void }> = ({ runs, onClick }) => (
  <Button variant="outline" className="w-full aspect-square text-xl font-semibold" onClick={() => onClick(runs)}>
    {runs}
  </Button>
);

const ExtraButton: React.FC<{ type: BallEvent['extraType']; onClick: (type: BallEvent['extraType']) => void }> = ({ type, onClick }) => (
    <Button variant="secondary" size="sm" className="flex-1" onClick={() => onClick(type)}>
        {type}
    </Button>
);

const ScoringPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate(); // v7 hook
  const context = useMatchContext();
  const { 
    matchDetails, loadMatch, startNewMatch, updateTossAndStartInnings, addBall, switchInnings, saveMatchState, endMatch,
    currentStrikerName, currentNonStrikerName, currentBowlerName, setPlayerRoles, currentInningsNumber, target
  } = context;

  const [pageLoading, setPageLoading] = useState(true);
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

  const [showPlayerRolesModal, setShowPlayerRolesModal] = useState(false);
  // States for player role selection in the modal
  const [modalStriker, setModalStriker] = useState<string>('');
  const [modalNonStriker, setModalNonStriker] = useState<string>('');
  const [modalBowler, setModalBowler] = useState<string>('');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketDetails, setWicketDetails] = useState<{ batsmanOut: string; dismissalType: DismissalType; bowler?: string; fielder?: string; }>({ batsmanOut: '', dismissalType: DismissalType.BOWLED });


  const initializePage = useCallback(async () => {
    console.log('[ScoringPage] initializePage called. matchId:', matchId);
    setPageLoading(true);
    if (!matchId) { 
      console.log('[ScoringPage] No matchId, navigating to /matches');
      navigate('/matches'); 
      return; 
    }

    let loadedMatch = context.matchDetails && context.matchDetails.id === matchId ? context.matchDetails : await loadMatch(matchId);
    console.log('[ScoringPage] loadedMatch after initial loadAttempt:', loadedMatch);

    if (matchId === "newmatch" && !loadedMatch) {
      console.log('[ScoringPage] matchId is "newmatch" and no existing match loaded. Calling startNewMatch.');
      const tempMatchData: Partial<Match> = {
        teamAName: "Team A", teamBName: "Team B", date: new Date().toISOString(),
        venue: "Local Ground", format: MatchFormat.T20, status: "Upcoming", overs_per_innings: 20,
        teamASquad: [], teamBSquad: [],
      };
      loadedMatch = await startNewMatch(tempMatchData);
      console.log('[ScoringPage] loadedMatch after startNewMatch call:', loadedMatch);
      // After starting a new match, update the URL to reflect the new match's ID
      if (loadedMatch && loadedMatch.id) {
        navigate(`/matches/${loadedMatch.id}/score`, { replace: true });
      }
    }

    if (loadedMatch) {
      console.log('[ScoringPage] Conditions Check: loadedMatch.id:', loadedMatch.id, 'status:', loadedMatch.status, 'tossWinnerName:', loadedMatch.tossWinnerName);
      if (loadedMatch.status === "Upcoming" && !loadedMatch.tossWinnerName) {
        console.log('[ScoringPage] CONDITION MET: Show Toss Modal.');
        setTossWinnerNameState(loadedMatch.teamAName); 
        setShowTossModal(true);
      } else if (loadedMatch.status === "Live" && (!loadedMatch.teamASquad || loadedMatch.teamASquad.length < SQUAD_SIZE || !loadedMatch.teamBSquad || loadedMatch.teamBSquad.length < SQUAD_SIZE)) {
        console.log('[ScoringPage] CONDITION MET: Show Squad Selection Modal.');
        setAvailableTeamAPlayers(loadedMatch.teamASquad || []);
        setSelectedTeamASquad(loadedMatch.teamASquad || []);
        setAvailableTeamBPlayers(loadedMatch.teamBSquad || []);
        setSelectedTeamBSquad(loadedMatch.teamBSquad || []);
        setShowSquadSelectionModal(true);
      } else if (loadedMatch.status === "Live" && (!currentStrikerName || !currentBowlerName)) {
        console.log('[ScoringPage] CONDITION MET: Show Player Roles Modal.');
        setModalStriker(loadedMatch.current_striker_name || '');
        setModalNonStriker(loadedMatch.current_non_striker_name || '');
        setModalBowler(loadedMatch.current_bowler_name || '');
        setShowPlayerRolesModal(true);
      } else {
        console.log('[ScoringPage] No initial modal condition met for loadedMatch.');
      }
    } else if (matchId !== "newmatch") {
      console.log('[ScoringPage] Match not loaded and matchId is not "newmatch", navigating to /matches.');
      navigate('/matches'); 
    } else {
      console.log('[ScoringPage] Critical: matchId is "newmatch" but loadedMatch is still null/undefined after trying to create it.');
       // This could happen if startNewMatch fails silently or returns null.
       // Potentially navigate away or show an error. For now, pageLoading will remain true or UI might hang.
    }
    setPageLoading(false);
    console.log('[ScoringPage] initializePage finished.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, navigate, loadMatch, startNewMatch, context.matchDetails, currentStrikerName, currentBowlerName]);

  useEffect(() => {
    initializePage();
  }, [initializePage]);


  const handleTossSubmit = async () => {
    if (!matchDetails || !tossWinnerNameState || !electedToState) return;
    console.log('[ScoringPage] handleTossSubmit called.');
    try {
      await updateTossAndStartInnings(tossWinnerNameState, electedToState);
      setShowTossModal(false);
      const currentMatchDetails = context.matchDetails; 
      if (!currentMatchDetails) {
          console.error("Match details are null after toss submission, cannot proceed.");
          return;
      }

      if (!currentMatchDetails.teamASquad || currentMatchDetails.teamASquad.length < SQUAD_SIZE || !currentMatchDetails.teamBSquad || currentMatchDetails.teamBSquad.length < SQUAD_SIZE) {
        setAvailableTeamAPlayers(currentMatchDetails.teamASquad || []);
        setSelectedTeamASquad(currentMatchDetails.teamASquad || []);
        setAvailableTeamBPlayers(currentMatchDetails.teamBSquad || []);
        setSelectedTeamBSquad(currentMatchDetails.teamBSquad || []);
        setShowSquadSelectionModal(true);
      } else {
        setModalStriker(currentMatchDetails.current_striker_name || '');
        setModalNonStriker(currentMatchDetails.current_non_striker_name || '');
        setModalBowler(currentMatchDetails.current_bowler_name || '');
        setShowPlayerRolesModal(true);
      }
    } catch (error) {
        console.error("Error submitting toss:", error);
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

  const handleConfirmSquads = async () => {
    if (!matchDetails) return;
    console.log('[ScoringPage] handleConfirmSquads called.');
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
        context.setMatchDetails(updatedMatchWithSquads); 
        await saveMatchState(); 
        setShowSquadSelectionModal(false);
        setModalStriker('');
        setModalNonStriker('');
        setModalBowler('');
        setShowPlayerRolesModal(true); 
    } catch (error) {
        console.error("Error saving squads:", error);
        alert("Failed to save squads. Please try again.");
    }
  };
  
  const handlePlayerRolesSubmit = async () => {
    if (!modalStriker || !modalNonStriker || !modalBowler) {
        alert("Please select striker, non-striker, and bowler.");
        return;
    }
    console.log('[ScoringPage] handlePlayerRolesSubmit called.');
    setPlayerRoles(modalStriker, modalNonStriker, modalBowler);
    if (matchDetails) {
        const updatedMatchData = {
            ...matchDetails,
            current_striker_name: modalStriker,
            current_non_striker_name: modalNonStriker,
            current_bowler_name: modalBowler,
        };
        context.setMatchDetails(updatedMatchData); 
        await saveMatchState(); 
    }
    setShowPlayerRolesModal(false);
  };

  const handleWicketSubmit = async () => {
    if (!currentStrikerName || !currentBowlerName) return; 
    console.log('[ScoringPage] handleWicketSubmit called.');
    const ballEvent: BallEvent = {
        runs: 0, 
        isWicket: true,
        wicketType: wicketDetails.dismissalType,
        batsmanOutName: wicketDetails.batsmanOut, 
        bowlerName: wicketDetails.bowler || currentBowlerName, 
        fielderName: wicketDetails.fielder,
        strikerName: currentStrikerName, 
    };
    await addBall(ballEvent);
    setShowWicketModal(false);
    
    const currentInningsData = currentInningsNumber === 1 ? matchDetails?.innings1Record : matchDetails?.innings2Record;
    if (currentInningsData && currentInningsData.totalWickets < SQUAD_SIZE -1) { 
        setModalStriker(''); 
        setModalNonStriker(wicketDetails.batsmanOut === currentStrikerName ? currentNonStrikerName! : currentStrikerName!); 
        setModalBowler(currentBowlerName!);
        setShowPlayerRolesModal(true); 
    }
  };
  
  const handleSimpleBallEvent = async (runs: number, isWicket: boolean = false, extraType?: BallEvent['extraType'], extraRuns?: number) => {
    if (!currentStrikerName || !currentBowlerName) {
        alert("Please set Striker and Bowler first!");
        setShowPlayerRolesModal(true);
        return;
    }
    console.log(`[ScoringPage] handleSimpleBallEvent: runs=${runs}, isWicket=${isWicket}, extraType=${extraType}, extraRuns=${extraRuns}`);
    if(isWicket) {
        setWicketDetails({ 
            batsmanOut: currentStrikerName, 
            dismissalType: DismissalType.BOWLED, 
            bowler: currentBowlerName,
            fielder: ''
        });
        setShowWicketModal(true);
    } else {
        const ballEvent: BallEvent = { 
            runs, 
            isWicket: false, 
            extraType, 
            extraRuns, 
            strikerName: currentStrikerName, 
            bowlerName: currentBowlerName 
        };
        await addBall(ballEvent);
    }
  };

  const currentMatchInningsData = currentInningsNumber === 1 ? matchDetails?.innings1Record : matchDetails?.innings2Record;
  const scoreForDisplay: Score | null = currentMatchInningsData && matchDetails?.current_batting_team ? {
      runs: currentMatchInningsData.totalRuns,
      wickets: currentMatchInningsData.totalWickets,
      overs: Math.floor(currentMatchInningsData.totalBallsBowled / 6),
      ballsThisOver: currentMatchInningsData.totalBallsBowled % 6,
      battingTeamName: matchDetails.current_batting_team,
      bowlingTeamName: matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamBName : matchDetails.teamAName,
  } : null;


  const renderSquadSelectionSection = (
    teamType: 'A' | 'B',
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
          {availablePlayers.length === 0 && <p className="text-sm text-gray-400 italic">No players added yet.</p>}
        </div>
      </div>
    );
  };


  if (pageLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!matchDetails) return <div className="text-center p-8 text-xl text-gray-300">Match details not loaded or found. <Link to="/matches" className="text-red-400 hover:underline">Go to Matches</Link></div>;

  // MODALS
  if (showTossModal) {
    const inputClass = "w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-100 placeholder-gray-400";
    const labelClass = "block text-sm font-medium text-gray-200 mb-1";
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div className="relative bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
          <button onClick={() => {setShowTossModal(false); if(matchId==="newmatch") navigate('/matches')}} aria-label="Close toss modal" className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 p-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          <h2 className="text-2xl font-bold text-gray-50 mb-6 text-center">
            {matchId === "newmatch" ? "Setup New Match & Toss" : "Match Toss"}
          </h2>
          {matchId === "newmatch" && (
            <p className="text-sm text-gray-400 text-center -mt-4 mb-6">
              Name your teams and decide who bats first.
            </p>
          )}
          {matchId === "newmatch" && (
            <div className="mb-4 space-y-3">
                 <div>
                    <label htmlFor="teamAName" className={labelClass}>Team A Name:</label>
                    <input type="text" id="teamAName" value={matchDetails.teamAName} 
                            onChange={(e) => context.setMatchDetails({...matchDetails, teamAName: e.target.value, ...(tossWinnerNameState === matchDetails.teamAName && { tossWinnerNameState: e.target.value}) })} 
                            className={inputClass}/>
                 </div>
                 <div>
                    <label htmlFor="teamBName" className={labelClass}>Team B Name:</label>
                    <input type="text" id="teamBName" value={matchDetails.teamBName} 
                            onChange={(e) => context.setMatchDetails({...matchDetails, teamBName: e.target.value, ...(tossWinnerNameState === matchDetails.teamBName && { tossWinnerNameState: e.target.value})})}
                            className={inputClass}/>
                 </div>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="tossWinner" className={labelClass}>Toss Won By:</label>
            <select id="tossWinner" value={tossWinnerNameState || ''} onChange={(e) => setTossWinnerNameState(e.target.value)} className={inputClass}>
              <option value="" disabled>Select Team</option>
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
          <Button onClick={handleTossSubmit} disabled={!tossWinnerNameState || !electedToState || !matchDetails.teamAName || !matchDetails.teamBName} className="w-full" variant="primary" size="lg">
            Finalize Toss & Proceed
          </Button>
        </div>
      </div>
    );
  }

  if (showSquadSelectionModal) {
     return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-50 mb-4 text-center">Select Playing XI ({SQUAD_SIZE} Players per Team)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {renderSquadSelectionSection('A', availableTeamAPlayers, selectedTeamASquad, newPlayerNameA, setNewPlayerNameA)}
                    {renderSquadSelectionSection('B', availableTeamBPlayers, selectedTeamBSquad, newPlayerNameB, setNewPlayerNameB)}
                </div>
                <Button 
                    onClick={handleConfirmSquads} 
                    disabled={selectedTeamASquad.length !== SQUAD_SIZE || selectedTeamBSquad.length !== SQUAD_SIZE}
                    className="w-full" variant="primary" size="lg">
                    Confirm Squads & Select Roles
                </Button>
                 <Button onClick={() => { setShowSquadSelectionModal(false); if(!matchDetails.tossWinnerName) setShowTossModal(true);}} variant="outline" size="sm" className="w-full mt-3">
                    Back
                </Button>
            </div>
        </div>
    );
  }

  if (showPlayerRolesModal && matchDetails) {
    const currentBattingTeamSquad = matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamASquad : matchDetails.teamBSquad;
    const currentBowlingTeamSquad = matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamBSquad : matchDetails.teamASquad;

    const activeInningsRecord = currentInningsNumber === 1 ? matchDetails.innings1Record : matchDetails.innings2Record;
    const availableBatsmen = currentBattingTeamSquad?.filter(pName => {
        const pStat = activeInningsRecord?.battingPerformances.find(bp => bp.playerName === pName);
        return !pStat || pStat.status === DismissalType.NOT_OUT;
    }) || [];
    
    const inputClass = "w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-red-500 focus:border-red-500";
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                <h2 className="text-xl font-bold text-gray-50 mb-4">Set Player Roles for Current Innings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="striker" className="block text-sm font-medium text-gray-300 mb-1">Striker:</label>
                        <select id="striker" value={modalStriker} onChange={e => setModalStriker(e.target.value)} className={inputClass}>
                            <option value="">Select Striker</option>
                            {availableBatsmen?.map(p => <option key={`s-${p}`} value={p} disabled={p === modalNonStriker}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="nonStriker" className="block text-sm font-medium text-gray-300 mb-1">Non-Striker:</label>
                        <select id="nonStriker" value={modalNonStriker} onChange={e => setModalNonStriker(e.target.value)} className={inputClass}>
                            <option value="">Select Non-Striker</option>
                            {availableBatsmen?.map(p => <option key={`ns-${p}`} value={p} disabled={p === modalStriker}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="bowler" className="block text-sm font-medium text-gray-300 mb-1">Current Bowler:</label>
                        <select id="bowler" value={modalBowler} onChange={e => setModalBowler(e.target.value)} className={inputClass}>
                            <option value="">Select Bowler</option>
                            {currentBowlingTeamSquad?.map(p => <option key={`b-${p}`} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setShowPlayerRolesModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handlePlayerRolesSubmit}>Confirm Roles</Button>
                </div>
            </div>
        </div>
    );
  }
  
  if (showWicketModal && matchDetails) {
    const activeBatsmen = [currentStrikerName, currentNonStrikerName].filter(Boolean) as string[];
    const currentBowlingTeamSquad = matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamBSquad : matchDetails.teamASquad;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                <h2 className="text-xl font-bold text-red-400 mb-4">Wicket Details</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm text-gray-300">Batsman Out:</label>
                        <select value={wicketDetails.batsmanOut} onChange={e => setWicketDetails(s => ({...s, batsmanOut: e.target.value}))} className="w-full mt-1 p-2 bg-gray-700 rounded">
                            {activeBatsmen.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-300">Dismissal Type:</label>
                        <select value={wicketDetails.dismissalType} onChange={e => setWicketDetails(s => ({...s, dismissalType: e.target.value as DismissalType}))}  className="w-full mt-1 p-2 bg-gray-700 rounded">
                            {Object.values(DismissalType).filter(dt => dt !== DismissalType.NOT_OUT).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     {(wicketDetails.dismissalType === DismissalType.CAUGHT || wicketDetails.dismissalType === DismissalType.STUMPED || wicketDetails.dismissalType === DismissalType.RUN_OUT) && (
                        <div>
                            <label className="text-sm text-gray-300">Fielder:</label>
                            <select value={wicketDetails.fielder} onChange={e => setWicketDetails(s => ({...s, fielder: e.target.value}))}  className="w-full mt-1 p-2 bg-gray-700 rounded">
                                <option value="">Select Fielder</option>
                                {currentBowlingTeamSquad?.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowWicketModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleWicketSubmit}>Confirm Wicket</Button>
                </div>
            </div>
        </div>
    );
  }


  // Fallback / Incomplete Setup checks
  if (matchDetails.status === "Live" && (!matchDetails.teamASquad || matchDetails.teamASquad.length < SQUAD_SIZE || !matchDetails.teamBSquad || matchDetails.teamBSquad.length < SQUAD_SIZE)) {
    return (
        <div className="text-center p-8 text-xl text-gray-300">
            <p className="mb-3">Squads not selected for this match.</p>
            <Button onClick={() => {
                setAvailableTeamAPlayers(matchDetails.teamASquad || []); setSelectedTeamASquad(matchDetails.teamASquad || []);
                setAvailableTeamBPlayers(matchDetails.teamBSquad || []); setSelectedTeamBSquad(matchDetails.teamBSquad || []);
                setShowSquadSelectionModal(true);
            }} className="mt-2" variant="primary">Select Squads</Button>
            <Link to="/matches" className="block mt-4 text-red-400 hover:underline">Go to Matches</Link>
        </div>
    );
  }
  if (matchDetails.status === "Live" && (!currentStrikerName || !currentBowlerName)) {
    return (
        <div className="text-center p-8 text-xl text-gray-300">
            <p className="mb-3">Player roles (striker, bowler) not set.</p>
            <Button onClick={() => setShowPlayerRolesModal(true)} className="mt-2" variant="primary">Set Player Roles</Button>
            <Link to="/matches" className="block mt-4 text-red-400 hover:underline">Go to Matches</Link>
        </div>
    );
  }


  // MAIN SCORING INTERFACE
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-50 text-center">
        {matchDetails.teamAName} vs {matchDetails.teamBName}
      </h1>
      
      <ScoreDisplay score={scoreForDisplay} target={target} currentInnings={currentInningsNumber} totalOvers={matchDetails.overs_per_innings} />
      
      <div className="p-2 bg-gray-800 rounded-lg shadow border border-gray-700 text-sm text-gray-300 text-center">
        <p>Striker: <span className="font-semibold text-gray-100">{currentStrikerName || "N/A"}</span></p>
        <p>Non-Striker: <span className="font-semibold text-gray-100">{currentNonStrikerName || "N/A"}</span></p>
        <p>Bowler: <span className="font-semibold text-gray-100">{currentBowlerName || "N/A"}</span></p>
        <Button size="sm" variant="outline" className="mt-1" onClick={() => setShowPlayerRolesModal(true)}>Change Roles</Button>
      </div>


      <div className="p-4 bg-gray-800 rounded-lg shadow space-y-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100">Scoring Controls:</h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(r => <RunsButton key={r} runs={r} onClick={() => handleSimpleBallEvent(r)} />)}
          <Button variant="danger" className="w-full aspect-square text-lg font-semibold" onClick={() => handleSimpleBallEvent(0, true)}>WKT</Button>
        </div>
        <div className="flex space-x-2">
            {(["Wide", "NoBall", "Byes", "LegByes"] as BallEvent['extraType'][]).map(type => 
                <ExtraButton key={type} type={type} onClick={() => {
                    const extraRunsValue = type === "Wide" || type === "NoBall" ? 1 : promptForExtraRuns(type); 
                    if (extraRunsValue === null) return; 
                    handleSimpleBallEvent(0, false, type, extraRunsValue); 
                }} />
            )}
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">Match Actions:</h3>
          {currentInningsNumber === 1 && currentMatchInningsData && (currentMatchInningsData.totalWickets >= SQUAD_SIZE -1 || (matchDetails.overs_per_innings && currentMatchInningsData.totalOversBowled >= matchDetails.overs_per_innings)) && (
            <Button onClick={switchInnings} variant="primary" className="w-full mb-3">End Innings & Start 2nd Innings</Button>
          )}
          <Button onClick={async () => { await saveMatchState(); navigate('/matches');}} variant="outline" className="w-full">Save & Exit to Matches</Button>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow mt-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Recent Events: (Timeline)</h3>
        <ul className="text-sm space-y-1.5 text-gray-300 max-h-40 overflow-y-auto pr-2">
            {currentMatchInningsData?.timeline?.slice(-10).reverse().map((event, idx) => (
                <li key={idx} className="border-b border-gray-700 pb-1.5">
                   Ball for {event.strikerName}: {event.isWicket ? <span className="font-semibold text-red-400">WICKET! ({event.wicketType})</span> : `${event.runs} run(s)`}
                   {event.extraType && <span className="text-yellow-400"> ({event.extraType}{event.extraRuns ? ` +${event.extraRuns}` : ''})</span>}
                </li>
            ))}
            {(!currentMatchInningsData?.timeline || currentMatchInningsData.timeline.length === 0) && <li className="text-gray-400">No events yet.</li>}
        </ul>
      </div>
    </div>
  );
};

const promptForExtraRuns = (type: string): number | null => {
    const runsStr = prompt(`Enter ${type} runs (0-6):`);
    if (runsStr === null) return null; 
    const runs = parseInt(runsStr, 10);
    if (isNaN(runs) || runs < 0 || runs > 6) {
        alert("Invalid number of runs. Please enter a value between 0 and 6.");
        return null;
    }
    return runs;
};

export default ScoringPage;
