

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Match, BallEvent, Score, MatchFormat, PlayerBattingStats, PlayerBowlingStats, DismissalType, InningsRecord } from '../types';
import ScoreDisplay from '../components/ScoreDisplay';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMatchContext } from '../contexts/MatchContext';
import BallDisplayIcon from '../components/BallDisplayIcon'; 
import EditBallModal from '../components/EditBallModal'; 

const SQUAD_SIZE = 11;

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
  const navigate = useNavigate();
  const context = useMatchContext();
  const { 
    matchDetails, loadMatch, addBall, switchInnings, saveMatchState, endMatch,
    currentStrikerName, currentNonStrikerName, currentBowlerName, setPlayerRoles, currentInningsNumber, target,
    updateBallEvent, refreshActiveInningsPlayerLists
  } = context;

  const [pageLoading, setPageLoading] = useState(true);
  
  const [showSquadSelectionModal, setShowSquadSelectionModal] = useState(false);
  const [availableTeamAPlayers, setAvailableTeamAPlayers] = useState<string[]>([]);
  const [availableTeamBPlayers, setAvailableTeamBPlayers] = useState<string[]>([]);
  const [selectedTeamASquad, setSelectedTeamASquad] = useState<string[]>([]);
  const [selectedTeamBSquad, setSelectedTeamBSquad] = useState<string[]>([]);
  const [newPlayerNameA, setNewPlayerNameA] = useState('');
  const [newPlayerNameB, setNewPlayerNameB] = useState('');

  const [showPlayerRolesModal, setShowPlayerRolesModal] = useState(false);
  const [modalStriker, setModalStriker] = useState<string>('');
  const [modalNonStriker, setModalNonStriker] = useState<string>('');
  const [modalBowler, setModalBowler] = useState<string>('');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketDetails, setWicketDetails] = useState<{ batsmanOut: string; dismissalType: DismissalType; bowler?: string; fielder?: string; }>({ batsmanOut: '', dismissalType: DismissalType.BOWLED });

  const [isEditBallModalOpen, setIsEditBallModalOpen] = useState(false);
  const [editingBallTimelineIndex, setEditingBallTimelineIndex] = useState<number | null>(null);


  const initializePage = useCallback(async () => {
    console.log('[ScoringPage] initializePage called. matchId:', matchId);
    setPageLoading(true);
    if (!matchId) { 
      console.log('[ScoringPage] No matchId, navigating to /matches');
      navigate('/matches', { replace: true }); 
      return; 
    }

    let loadedMatch = context.matchDetails && context.matchDetails.id === matchId ? context.matchDetails : await loadMatch(matchId);
    console.log('[ScoringPage] loadedMatch after initial loadAttempt:', loadedMatch);

    if (loadedMatch) {
      if (loadedMatch.status === "Upcoming" && !loadedMatch.tossWinnerName) {
        console.log('[ScoringPage] Match upcoming and toss not done, redirecting to TossPage.');
        navigate(`/toss/${loadedMatch.id}`, { replace: true });
        return;
      }
      
      console.log('[ScoringPage] Conditions Check: loadedMatch.id:', loadedMatch.id, 'status:', loadedMatch.status, 'tossWinnerName:', loadedMatch.tossWinnerName);
      if (loadedMatch.status === "Live" && (!loadedMatch.teamASquad || loadedMatch.teamASquad.length < SQUAD_SIZE || !loadedMatch.teamBSquad || loadedMatch.teamBSquad.length < SQUAD_SIZE)) {
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
    } else {
      console.log('[ScoringPage] Match not loaded, navigating to /matches.');
      navigate('/matches', {replace: true}); 
    }
    setPageLoading(false);
    console.log('[ScoringPage] initializePage finished.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, navigate, loadMatch, context.matchDetails]); // Removed currentStrikerName, currentBowlerName as they are from context and change separately

  useEffect(() => {
    initializePage();
  }, [initializePage]);
  
  // Effect to re-open player roles modal if roles become unset during a live match
  useEffect(() => {
    if (matchDetails?.status === "Live" && (!currentStrikerName || !currentBowlerName) && !showPlayerRolesModal && !showSquadSelectionModal && !pageLoading && !isEditBallModalOpen && !showWicketModal) {
      console.log("[ScoringPage] Roles became unset during live match, prompting modal.");
      setModalStriker(matchDetails.current_striker_name || '');
      setModalNonStriker(matchDetails.current_non_striker_name || '');
      setModalBowler(matchDetails.current_bowler_name || '');
      setShowPlayerRolesModal(true);
    }
  }, [matchDetails, currentStrikerName, currentBowlerName, showPlayerRolesModal, showSquadSelectionModal, pageLoading, isEditBallModalOpen, showWicketModal]);


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
    const updatedMatchWithSquads = { // This updates the top-level Match.teamASquad/BSquad
        ...matchDetails,
        teamASquad: selectedTeamASquad,
        teamBSquad: selectedTeamBSquad,
    };
    try {
        context.setMatchDetails(updatedMatchWithSquads); 
        
        // Determine which squad is batting and which is bowling for the refresh function
        let battingSquadForRefresh: string[];
        let bowlingSquadForRefresh: string[];

        if (matchDetails.current_batting_team === matchDetails.teamAName) {
            battingSquadForRefresh = selectedTeamASquad;
            bowlingSquadForRefresh = selectedTeamBSquad;
        } else {
            battingSquadForRefresh = selectedTeamBSquad;
            bowlingSquadForRefresh = selectedTeamASquad;
        }
        
        // Refresh the player performance lists within the current innings record
        // This ensures PlayerBattingStats and PlayerBowlingStats objects are based on the confirmed 11 players
        await refreshActiveInningsPlayerLists(battingSquadForRefresh, bowlingSquadForRefresh);
        // saveMatchState will be called by refreshActiveInningsPlayerLists, no need to call again immediately.

        setShowSquadSelectionModal(false);
        setModalStriker(''); 
        setModalNonStriker('');
        setModalBowler('');
        setShowPlayerRolesModal(true); 
    } catch (error) {
        console.error("Error saving squads and refreshing innings players:", error);
        alert("Failed to save squads. Please try again.");
    }
  };
  
  const handlePlayerRolesSubmit = async () => {
    if (!modalStriker || !modalNonStriker || !modalBowler) {
        alert("Please select striker, non-striker, and bowler.");
        return;
    }
    if (modalStriker === modalNonStriker) {
        alert("Striker and Non-Striker cannot be the same player.");
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
    if (!currentStrikerName || !currentBowlerName || !matchDetails) return; 
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
    const wicketsAfterThisBall = (currentInningsData?.totalWickets || 0); // addBall updates this, so just read it

    if (wicketsAfterThisBall < SQUAD_SIZE -1) { 
        setModalStriker(''); 
        setModalNonStriker(wicketDetails.batsmanOut === currentStrikerName ? currentNonStrikerName! : currentStrikerName!); 
        setModalBowler(currentBowlerName!); 
        setShowPlayerRolesModal(true); 
    }
  };
  
  const handleSimpleBallEvent = async (runs: number, isWicket: boolean = false, extraType?: BallEvent['extraType'], extraRunsForEvent?: number) => {
    if (!currentStrikerName || !currentBowlerName) {
        alert("Please set Striker and Bowler first!");
        setShowPlayerRolesModal(true);
        return;
    }
    console.log(`[ScoringPage] handleSimpleBallEvent: runs=${runs}, isWicket=${isWicket}, extraType=${extraType}, extraRunsForEvent=${extraRunsForEvent}`);
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
            extraRuns: extraRunsForEvent, 
            strikerName: currentStrikerName, 
            bowlerName: currentBowlerName 
        };
        await addBall(ballEvent);
    }
  };

  const handleExtraButtonClick = (type: BallEvent['extraType']) => {
    if (!currentStrikerName || !currentBowlerName) {
        alert("Please set Striker and Bowler first!");
        setShowPlayerRolesModal(true);
        return;
    }

    let runsValue: number | null = null;
    let extraRunsForEvent: number;

    if (type === "Wide") {
        const wideRunsStr = prompt(`Enter TOTAL runs for this Wide delivery (e.g., 1 for just wide, 5 if wide + boundary 4):`, "1");
        runsValue = wideRunsStr !== null ? parseInt(wideRunsStr, 10) : null;
        if (runsValue === null) return; 
        if (isNaN(runsValue) || runsValue < 1 || runsValue > 7) { 
            alert("Invalid input. Total Wide runs must be between 1 and 7."); return;
        }
        extraRunsForEvent = runsValue;
    } else if (type === "NoBall") {
        const noBallScoredStr = prompt(`Enter runs scored OFF this No Ball (by bat or as other extras like byes/overthrows, enter 0 if none):`, "0");
        runsValue = noBallScoredStr !== null ? parseInt(noBallScoredStr, 10) : null;
        if (runsValue === null) return; 
        if (isNaN(runsValue) || runsValue < 0 || runsValue > 6) { 
            alert("Invalid input for runs scored off No Ball (0-6)."); return;
        }
        extraRunsForEvent = runsValue + 1; 
    } else { 
        const byeLegByeRunsStr = prompt(`Enter runs for ${type} (0-6):`, "0");
        runsValue = byeLegByeRunsStr !== null ? parseInt(byeLegByeRunsStr, 10) : null;
        if (runsValue === null) return; 
        if (isNaN(runsValue) || runsValue < 0 || runsValue > 6) {
            alert(`Invalid input for ${type} runs (0-6).`); return;
        }
        extraRunsForEvent = runsValue;
    }
    handleSimpleBallEvent(0, false, type, extraRunsForEvent);
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

  const currentOverEvents: (BallEvent | null)[] = useMemo(() => {
    const events: (BallEvent | null)[] = Array(6).fill(null);
    if (!currentMatchInningsData || !currentMatchInningsData.timeline) return events;

    const ballsThisOverCount = currentMatchInningsData.totalBallsBowled % 6;
    const ballsInTimeline = currentMatchInningsData.timeline.length;
    
    if (ballsThisOverCount > 0 || (ballsThisOverCount === 0 && currentMatchInningsData.totalBallsBowled > 0)) {
        let startIndexInTimeline = ballsInTimeline - ballsThisOverCount;
        if (ballsThisOverCount === 0 && currentMatchInningsData.totalBallsBowled > 0) { 
            startIndexInTimeline = ballsInTimeline - 6;
        }
        
        for (let i = 0; i < 6; i++) {
            if (startIndexInTimeline + i < ballsInTimeline && startIndexInTimeline +i >= 0 && i < (ballsThisOverCount === 0 && currentMatchInningsData.totalBallsBowled > 0 ? 6 : ballsThisOverCount) ) {
                events[i] = currentMatchInningsData.timeline[startIndexInTimeline + i];
            }
        }
    }
    return events;
  }, [currentMatchInningsData]);

  const handleEditBall = (ballIndexInOver: number) => {
    if (!currentMatchInningsData || !currentMatchInningsData.timeline) return;
    
    const totalBallsBowledInOverSoFar = currentMatchInningsData.totalBallsBowled % 6;
    let actualBallsInOver = totalBallsBowledInOverSoFar;
    if (totalBallsBowledInOverSoFar === 0 && currentMatchInningsData.totalBallsBowled > 0) {
        actualBallsInOver = 6; 
    }

    if (ballIndexInOver >= actualBallsInOver) return; 

    const ballsBowledBeforeThisOver = currentMatchInningsData.totalBallsBowled - actualBallsInOver;
    const timelineIdx = ballsBowledBeforeThisOver + ballIndexInOver;

    if (timelineIdx >= 0 && timelineIdx < currentMatchInningsData.timeline.length) {
        setEditingBallTimelineIndex(timelineIdx);
        setIsEditBallModalOpen(true);
    } else {
        console.error("Calculated timeline index for edit is out of bounds.");
    }
  };

  const handleEditBallSubmit = async (updatedEvent: BallEvent) => {
    if (editingBallTimelineIndex !== null) {
      await updateBallEvent(editingBallTimelineIndex, updatedEvent);
    }
    setIsEditBallModalOpen(false);
    setEditingBallTimelineIndex(null);
  };
  

  const modalInputBaseClass = "w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const modalInputFocusClass = "focus:ring-teal-500 focus:border-teal-500"; 
  const modalInputClass = `${modalInputBaseClass} ${modalInputFocusClass}`;
  const modalLabelClass = "block text-sm font-medium text-gray-200 mb-1";


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
            className={`flex-grow p-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 placeholder-gray-400 ${modalInputFocusClass}`}
          />
          <Button onClick={() => handleAddPlayer(teamType)} variant="secondary" size="sm">Add Player</Button>
        </div>
        {availablePlayers.length > 0 && <p className="text-xs text-gray-400">Select {SQUAD_SIZE} players:</p>}
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {availablePlayers.map(player => (
            <label key={`${teamType}-${player}`} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${selectedSquad.includes(player) ? 'bg-teal-700 text-white' : 'bg-gray-700 hover:bg-teal-800 text-gray-200'}`}>
              <input 
                type="checkbox" 
                checked={selectedSquad.includes(player)} 
                onChange={() => handleSquadPlayerSelection(player, teamType)}
                disabled={!selectedSquad.includes(player) && selectedSquad.length >= SQUAD_SIZE}
                className="form-checkbox h-4 w-4 text-teal-600 border-gray-500 rounded focus:ring-teal-500 bg-gray-500 checked:bg-teal-600 focus:ring-offset-gray-700"
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
  if (!matchDetails) return <div className="text-center p-8 text-xl text-gray-300">Match details not loaded or found. <Link to="/matches" className="text-teal-400 hover:underline">Go to Matches</Link></div>;


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
                 <Button onClick={() => { setShowSquadSelectionModal(false); navigate(`/toss/${matchId}`, {replace: true}); }} variant="outline" size="sm" className="w-full mt-3">
                    Back to Toss
                </Button>
            </div>
        </div>
    );
  }

  if (showPlayerRolesModal && matchDetails) {
    const currentBattingTeamSquad = matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamASquad : matchDetails.teamBSquad;
    const currentBowlingTeamSquad = matchDetails.current_batting_team === matchDetails.teamAName ? matchDetails.teamBSquad : matchDetails.teamASquad;

    const activeInningsRecord = currentInningsNumber === 1 ? matchDetails.innings1Record : matchDetails.innings2Record;
    // Batsmen available for selection are those in the confirmed squad who are not out
    const availableBatsmen = currentBattingTeamSquad?.filter(pName => {
        const pStat = activeInningsRecord?.battingPerformances.find(bp => bp.playerName === pName);
        return !pStat || pStat.status === DismissalType.NOT_OUT;
    }) || [];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
                <h2 className="text-xl font-bold text-gray-50 mb-4">Set Player Roles for Current Innings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="striker" className="block text-sm font-medium text-gray-300 mb-1">Striker:</label>
                        <select id="striker" value={modalStriker} onChange={e => setModalStriker(e.target.value)} className={modalInputClass}>
                            <option value="">Select Striker</option>
                            {availableBatsmen?.map(p => <option key={`s-${p}`} value={p} disabled={p === modalNonStriker}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="nonStriker" className="block text-sm font-medium text-gray-300 mb-1">Non-Striker:</label>
                        <select id="nonStriker" value={modalNonStriker} onChange={e => setModalNonStriker(e.target.value)} className={modalInputClass}>
                            <option value="">Select Non-Striker</option>
                            {availableBatsmen?.map(p => <option key={`ns-${p}`} value={p} disabled={p === modalStriker}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="bowler" className="block text-sm font-medium text-gray-300 mb-1">Current Bowler:</label>
                        <select id="bowler" value={modalBowler} onChange={e => setModalBowler(e.target.value)} className={modalInputClass}>
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
                        <select value={wicketDetails.batsmanOut} onChange={e => setWicketDetails(s => ({...s, batsmanOut: e.target.value}))} className={`w-full mt-1 p-2 bg-gray-700 rounded ${modalInputFocusClass}`}>
                            {activeBatsmen.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-300">Dismissal Type:</label>
                        <select value={wicketDetails.dismissalType} onChange={e => setWicketDetails(s => ({...s, dismissalType: e.target.value as DismissalType}))}  className={`w-full mt-1 p-2 bg-gray-700 rounded ${modalInputFocusClass}`}>
                            {Object.values(DismissalType).filter(dt => dt !== DismissalType.NOT_OUT).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     {(wicketDetails.dismissalType === DismissalType.CAUGHT || wicketDetails.dismissalType === DismissalType.STUMPED || wicketDetails.dismissalType === DismissalType.RUN_OUT) && (
                        <div>
                            <label className="text-sm text-gray-300">Fielder:</label>
                            <select value={wicketDetails.fielder} onChange={e => setWicketDetails(s => ({...s, fielder: e.target.value}))}  className={`w-full mt-1 p-2 bg-gray-700 rounded ${modalInputFocusClass}`}>
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

   if (isEditBallModalOpen && editingBallTimelineIndex !== null && currentMatchInningsData?.timeline) {
    const ballToEdit = currentMatchInningsData.timeline[editingBallTimelineIndex];
    return (
      <EditBallModal
        isOpen={isEditBallModalOpen}
        onClose={() => { setIsEditBallModalOpen(false); setEditingBallTimelineIndex(null); }}
        ballEventToEdit={ballToEdit}
        onSubmit={handleEditBallSubmit}
        currentStrikerName={currentStrikerName}
        currentNonStrikerName={currentNonStrikerName}
        bowlingTeamSquad={matchDetails?.current_batting_team === matchDetails?.teamAName ? matchDetails?.teamBSquad : matchDetails?.teamASquad}
        battingTeamSquad={matchDetails?.current_batting_team === matchDetails?.teamAName ? matchDetails?.teamASquad : matchDetails?.teamBSquad}
      />
    );
  }

  if (matchDetails.status === "Live" && (!matchDetails.teamASquad || matchDetails.teamASquad.length < SQUAD_SIZE || !matchDetails.teamBSquad || matchDetails.teamBSquad.length < SQUAD_SIZE)) {
    return (
        <div className="text-center p-8 text-xl text-gray-300">
            <p className="mb-3">Squads not selected for this match.</p>
            <Button onClick={() => {
                setAvailableTeamAPlayers(matchDetails.teamASquad || []); setSelectedTeamASquad(matchDetails.teamASquad || []);
                setAvailableTeamBPlayers(matchDetails.teamBSquad || []); setSelectedTeamBSquad(matchDetails.teamBSquad || []);
                setShowSquadSelectionModal(true);
            }} className="mt-2" variant="primary">Select Squads</Button>
            <Link to="/matches" className="block mt-4 text-teal-400 hover:underline">Go to Matches</Link>
        </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-50 text-center">
        {matchDetails.teamAName} vs {matchDetails.teamBName}
      </h1>
      
      <ScoreDisplay 
        score={scoreForDisplay} 
        target={target} 
        currentInnings={currentInningsNumber} 
        totalOvers={matchDetails.overs_per_innings}
        strikerName={currentStrikerName}
        nonStrikerName={currentNonStrikerName}
        bowlerName={currentBowlerName}
      />
      
      <div className="p-2 bg-gray-800 rounded-lg shadow border border-gray-700 text-sm text-gray-300 text-center">
        <p>Striker: <span className="font-semibold text-gray-100">{currentStrikerName || "N/A"}</span></p>
        <p>Non-Striker: <span className="font-semibold text-gray-100">{currentNonStrikerName || "N/A"}</span></p>
        <p>Bowler: <span className="font-semibold text-gray-100">{currentBowlerName || "N/A"}</span></p>
        <Button size="sm" variant="outline" className="mt-1" onClick={() => setShowPlayerRolesModal(true)}>Change Roles</Button>
      </div>

      <div className="p-3 bg-gray-800 rounded-lg shadow border border-gray-700">
        <h3 className="text-md font-semibold text-gray-200 mb-2 text-center">Current Over:</h3>
        <div className="flex justify-center space-x-1.5 sm:space-x-2">
            {currentOverEvents.map((ballEvent, index) => (
                <BallDisplayIcon 
                    key={index} 
                    ballEvent={ballEvent} 
                    ballNumberInOver={index + 1}
                    onClick={ballEvent ? () => handleEditBall(index) : undefined}
                    isCurrentBall={!ballEvent && scoreForDisplay?.ballsThisOver === index && (scoreForDisplay.wickets < SQUAD_SIZE -1 || (matchDetails?.overs_per_innings ? scoreForDisplay.overs < matchDetails.overs_per_innings : true))}
                />
            ))}
        </div>
      </div>


      <div className="p-4 bg-gray-800 rounded-lg shadow space-y-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-gray-100">Scoring Controls:</h3>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map(r => <RunsButton key={r} runs={r} onClick={() => handleSimpleBallEvent(r)} />)}
          <Button variant="danger" className="w-full aspect-square text-lg font-semibold" onClick={() => handleSimpleBallEvent(0, true)}>WKT</Button>
        </div>
        <div className="flex space-x-2">
            {(["Wide", "NoBall", "Byes", "LegByes"] as BallEvent['extraType'][]).map(type => 
                <ExtraButton key={type} type={type} onClick={() => handleExtraButtonClick(type!)} />
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
                <li key={event.ballId || `ball-${idx}`} className="border-b border-gray-700 pb-1.5">
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

export default ScoringPage;
