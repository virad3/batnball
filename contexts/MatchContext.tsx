
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, BallEvent, InningsRecord, PlayerBattingStats, PlayerBowlingStats, DismissalType, MatchContextType, MatchState } from '../types';
import { createMatch, getMatchById, updateMatch } from '../services/dataService';

const SQUAD_SIZE = 11; // Default squad size for initialization

const initialMatchState: MatchState = {
  matchDetails: null,
  currentStrikerName: null,
  currentNonStrikerName: null,
  currentBowlerName: null,
  currentInningsNumber: 1,
  target: null,
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MatchState>(initialMatchState);

  const setMatchDetails = useCallback((match: Match | null) => {
    console.log('[MatchContext] setMatchDetails called with:', match);
    setState(prevState => ({
        ...prevState,
        matchDetails: match,
        currentInningsNumber: match?.innings2Record ? 2 : 1, 
        target: match?.innings1Record ? match.innings1Record.totalRuns + 1 : null,
        currentStrikerName: match ? prevState.currentStrikerName : null, 
        currentNonStrikerName: match ? prevState.currentNonStrikerName : null,
        currentBowlerName: match ? prevState.currentBowlerName : null,
    }));
  }, []);

  const setPlayerRoles = useCallback((striker?: string, nonStriker?: string, bowler?: string) => {
    setState(prevState => ({
        ...prevState,
        currentStrikerName: striker !== undefined ? striker : prevState.currentStrikerName,
        currentNonStrikerName: nonStriker !== undefined ? nonStriker : prevState.currentNonStrikerName,
        currentBowlerName: bowler !== undefined ? bowler : prevState.currentBowlerName,
    }));
  }, []);

  const initializeInningsRecord = (teamName: string, squad: string[] = [], oppositionSquad: string[] = []): InningsRecord => {
    return {
      teamName: teamName,
      totalRuns: 0,
      totalWickets: 0,
      totalOversBowled: 0,
      totalBallsBowled: 0,
      battingPerformances: squad.map((playerName, index) => ({
        playerId: playerName, 
        playerName: playerName,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        status: DismissalType.NOT_OUT,
        battingOrder: index +1,
      })),
      bowlingPerformances: oppositionSquad.map(playerName => ({
        playerId: playerName,
        playerName: playerName,
        oversBowled: 0,
        ballsBowled: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
      })),
      timeline: []
    };
  };
  
  const loadMatch = useCallback(async (matchId: string): Promise<Match | null> => {
    console.log('[MatchContext] loadMatch called for matchId:', matchId);
    try {
        const fetchedMatch = await getMatchById(matchId);
        console.log('[MatchContext] fetchedMatch from dataService:', fetchedMatch);
        if (fetchedMatch) {
            setMatchDetails(fetchedMatch);
            setState(prevState => ({
                ...prevState,
                currentStrikerName: fetchedMatch.current_striker_name || null,
                currentNonStrikerName: fetchedMatch.current_non_striker_name || null,
                currentBowlerName: fetchedMatch.current_bowler_name || null,
                currentInningsNumber: fetchedMatch.innings2Record ? 2 : (fetchedMatch.innings1Record ? 1 : 1),
                target: fetchedMatch.innings1Record ? fetchedMatch.innings1Record.totalRuns + 1 : null,
            }));
        } else {
            setMatchDetails(null);
        }
        return fetchedMatch;
    } catch (error) {
        console.error("Error loading match in context:", error);
        setMatchDetails(null);
        return null;
    }
  }, [setMatchDetails]);

  const startNewMatch = useCallback(async (partialMatchData: Partial<Match>): Promise<Match | null> => {
    console.log('[MatchContext] startNewMatch called with partialMatchData:', partialMatchData);
    try {
        const newMatchData: Partial<Match> = {
            status: "Upcoming",
            teamASquad: [],
            teamBSquad: [],
            ...partialMatchData,
        };
        const created = await createMatch(newMatchData);
        console.log('[MatchContext] Match CREATED by dataService in startNewMatch:', created);
        if (created) {
          setMatchDetails(created);
        } else {
          console.error('[MatchContext] createMatch returned null or undefined. Cannot set details.');
        }
        return created;
    } catch (error) {
        console.error("[MatchContext] Error starting new match in context:", error);
        return null;
    }
  }, [setMatchDetails]);

  const updateTossAndStartInnings = useCallback(async (tossWinner: string, elected: "Bat" | "Bowl") => {
    if (!state.matchDetails) throw new Error("Match details not available");
    console.log('[MatchContext] updateTossAndStartInnings. Toss Winner:', tossWinner, 'Elected:', elected);

    const match = state.matchDetails;
    const battingFirstTeam = elected === "Bat" ? tossWinner : (tossWinner === match.teamAName ? match.teamBName : match.teamAName);
    const bowlingFirstTeam = battingFirstTeam === match.teamAName ? match.teamBName : match.teamAName;
    
    const battingSquad = battingFirstTeam === match.teamAName ? match.teamASquad : match.teamBSquad;
    const bowlingSquad = bowlingFirstTeam === match.teamAName ? match.teamASquad : match.teamBSquad;

    const innings1 = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquad);

    const updatedMatch: Match = {
        ...match,
        tossWinnerName: tossWinner,
        electedTo: elected,
        status: "Live",
        innings1Record: innings1,
        current_batting_team: battingFirstTeam,
    };
    
    try {
        const savedMatch = await updateMatch(match.id, updatedMatch);
        setMatchDetails(savedMatch);
        setState(prevState => ({
            ...prevState,
            currentInningsNumber: 1,
            target: null, 
        }));
    } catch (error) {
        console.error("Error updating toss and starting innings:", error);
    }

  }, [state.matchDetails, setMatchDetails]);


  const addBall = useCallback(async (event: BallEvent) => {
    if (!state.matchDetails || !state.currentStrikerName || !state.currentBowlerName) {
        console.warn("Cannot add ball: Match details, striker, or bowler missing.");
        return;
    }
    console.log('[MatchContext] addBall event:', event);

    let match = { ...state.matchDetails };
    let currentInningsRec = state.currentInningsNumber === 1 ? match.innings1Record : match.innings2Record;

    if (!currentInningsRec) {
        console.error("Current innings record not found!");
        return;
    }
    
    currentInningsRec = JSON.parse(JSON.stringify(currentInningsRec));
    currentInningsRec.timeline = [...(currentInningsRec.timeline || []), event];

    const bowlerStats = currentInningsRec.bowlingPerformances.find(p => p.playerName === state.currentBowlerName);
    if (bowlerStats) {
        if (event.extraType !== "Wide" && event.extraType !== "NoBall") { 
            bowlerStats.ballsBowled += 1;
            const oversWhole = Math.floor(bowlerStats.ballsBowled / 6);
            const ballsRemainder = bowlerStats.ballsBowled % 6;
            bowlerStats.oversBowled = parseFloat(`${oversWhole}.${ballsRemainder}`);
        }
        bowlerStats.runsConceded += event.runs + (event.extraRuns || 0);
        if (event.isWicket && event.bowlerName === state.currentBowlerName && event.wicketType !== DismissalType.RUN_OUT) { 
            bowlerStats.wickets += 1;
        }
    }

    const strikerStats = currentInningsRec.battingPerformances.find(p => p.playerName === state.currentStrikerName);
    if (strikerStats) {
        if (event.extraType !== "Wide") { 
             if (event.extraType !== "Byes" && event.extraType !== "LegByes") {
                strikerStats.runs += event.runs;
                if (event.runs === 4) strikerStats.fours += 1;
                if (event.runs === 6) strikerStats.sixes += 1;
             }
        }
        if (event.extraType !== "Wide" && event.extraType !== "NoBall") { 
            strikerStats.ballsFaced += 1;
        }

        if (event.isWicket && event.batsmanOutName === state.currentStrikerName) {
            strikerStats.status = event.wicketType || DismissalType.OTHER;
            strikerStats.bowlerName = event.bowlerName; 
            strikerStats.fielderName = event.fielderName; 
            currentInningsRec.totalWickets += 1;
        }
    }
    
    if (event.extraType !== "Byes" && event.extraType !== "LegByes") {
        currentInningsRec.totalRuns += event.runs;
    }
    currentInningsRec.totalRuns += (event.extraRuns || 0); 
    
    if (event.extraType !== "Wide" && event.extraType !== "NoBall") {
       currentInningsRec.totalBallsBowled +=1;
    }
    const totalOversWhole = Math.floor(currentInningsRec.totalBallsBowled / 6);
    const totalBallsRemainder = currentInningsRec.totalBallsBowled % 6;
    currentInningsRec.totalOversBowled = parseFloat(`${totalOversWhole}.${totalBallsRemainder}`);


    if (state.currentInningsNumber === 1) {
        match.innings1Record = currentInningsRec;
    } else {
        match.innings2Record = currentInningsRec;
    }
    
    setState(prevState => ({ ...prevState, matchDetails: match }));
    await saveMatchState(match); 

  }, [state]);

  const switchInnings = useCallback(async () => {
    if (!state.matchDetails || !state.matchDetails.innings1Record || state.currentInningsNumber !== 1) return;
    console.log('[MatchContext] switchInnings called.');
    
    const match = { ...state.matchDetails };
    const newTarget = match.innings1Record.totalRuns + 1;

    const battingSecondTeam = match.current_batting_team === match.teamAName ? match.teamBName : match.teamAName;
    const bowlingSecondTeam = match.current_batting_team!; 

    const battingSquad = battingSecondTeam === match.teamAName ? match.teamASquad : match.teamBSquad;
    const bowlingSquad = bowlingSecondTeam === match.teamAName ? match.teamASquad : match.teamBSquad;

    match.innings2Record = initializeInningsRecord(battingSecondTeam, battingSquad, bowlingSquad);
    match.current_batting_team = battingSecondTeam; 

    setState(prevState => ({
        ...prevState,
        matchDetails: match,
        currentInningsNumber: 2,
        target: newTarget,
        currentStrikerName: null, 
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState(match);
  }, [state]);

  const saveMatchState = useCallback(async (matchToSave?: Match | null) => {
    const matchDataToSave = matchToSave || state.matchDetails;
    if (!matchDataToSave) return;
    console.log('[MatchContext] saveMatchState called for match ID:', matchDataToSave.id);

    const finalMatchData = {
        ...matchDataToSave,
        current_striker_name: state.currentStrikerName,
        current_non_striker_name: state.currentNonStrikerName,
        current_bowler_name: state.currentBowlerName,
    };

    try {
        const saved = await updateMatch(finalMatchData.id, finalMatchData);
        if (state.matchDetails && saved.id === state.matchDetails.id) {
           setState(prevState => ({...prevState, matchDetails: saved}));
        }
    } catch (error) {
        console.error("Error saving match state:", error);
    }
  }, [state.matchDetails, state.currentStrikerName, state.currentNonStrikerName, state.currentBowlerName]);


  const endMatch = useCallback(async (resultSummary: string) => {
    if (!state.matchDetails) return;
    console.log('[MatchContext] endMatch called. Result:', resultSummary);
    const match = { ...state.matchDetails, status: "Completed", result_summary: resultSummary } as Match;
    setState(prevState => ({ ...prevState, matchDetails: match }));
    await saveMatchState(match);
  }, [state.matchDetails, saveMatchState]);


  return (
    <MatchContext.Provider value={{ 
        ...state, 
        setMatchDetails, 
        loadMatch,
        startNewMatch,
        updateTossAndStartInnings,
        addBall, 
        switchInnings,
        saveMatchState,
        endMatch,
        setPlayerRoles
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatchContext = (): MatchContextType => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
};
