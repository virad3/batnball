
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, BallEvent, InningsRecord, PlayerBattingStats, PlayerBowlingStats, DismissalType, MatchContextType, MatchState, Team } from '../types';
import { createMatch, getMatchById, updateMatch } from '../services/dataService'; 
import { Timestamp } from '../services/firebaseClient'; // Use re-exported Timestamp

const SQUAD_SIZE = 11; 

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

  const convertMatchTimestampsToStrings = (matchWithPotentialTimestamp: Match | null): Match | null => {
    if (!matchWithPotentialTimestamp) return null;
    
    let processedDate: string;
    if (matchWithPotentialTimestamp.date instanceof Timestamp) { // Use imported Timestamp
        processedDate = matchWithPotentialTimestamp.date.toDate().toISOString();
    } else if (typeof matchWithPotentialTimestamp.date === 'string') {
        try {
            const d = new Date(matchWithPotentialTimestamp.date);
            if(isNaN(d.getTime())) throw new Error("Invalid date string for conversion");
            processedDate = d.toISOString();
        } catch(e) {
            console.warn("Match date string could not be parsed to ISO, using as is:", matchWithPotentialTimestamp.date, e);
            processedDate = matchWithPotentialTimestamp.date; 
        }
    } else {
        console.warn("Match date in unexpected format during conversion:", matchWithPotentialTimestamp.date);
        processedDate = new Date().toISOString(); 
    }

    return {
      ...matchWithPotentialTimestamp,
      date: processedDate,
    };
  };

  const setMatchDetails = useCallback((match: Match | null) => {
    console.log('[MatchContext] setMatchDetails called with:', match);
    const processedMatch = convertMatchTimestampsToStrings(match);
    setState(prevState => ({
        ...prevState,
        matchDetails: processedMatch,
        currentInningsNumber: processedMatch?.innings2Record ? 2 : (processedMatch?.innings1Record ? 1 : 1), 
        target: processedMatch?.innings1Record && processedMatch?.status !== "Upcoming" ? processedMatch.innings1Record.totalRuns + 1 : null,
        currentStrikerName: processedMatch ? (processedMatch.current_striker_name || prevState.currentStrikerName) : null, 
        currentNonStrikerName: processedMatch ? (processedMatch.current_non_striker_name || prevState.currentNonStrikerName) : null,
        currentBowlerName: processedMatch ? (processedMatch.current_bowler_name || prevState.currentBowlerName) : null,
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
    const defaultSquad = Array.from({ length: SQUAD_SIZE }, (_, i) => `${teamName} Player ${i + 1}`);
    const finalSquad = squad.length >= SQUAD_SIZE ? squad : defaultSquad;
    const finalOpponentSquad = oppositionSquad.length >= SQUAD_SIZE ? oppositionSquad : Array.from({ length: SQUAD_SIZE }, (_, i) => `Opponent Player ${i + 1}`);
    
    return {
      teamName: teamName,
      totalRuns: 0,
      totalWickets: 0,
      totalOversBowled: 0,
      totalBallsBowled: 0,
      battingPerformances: finalSquad.map((playerName, index) => ({
        playerId: playerName, 
        playerName: playerName,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        status: DismissalType.NOT_OUT,
        battingOrder: index + 1,
      })),
      bowlingPerformances: finalOpponentSquad.map(playerName => ({
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
        const fetchedMatchFromDb = await getMatchById(matchId);
        console.log('[MatchContext] fetchedMatch from dataService:', fetchedMatchFromDb);
        
        if (fetchedMatchFromDb) {
            setMatchDetails(fetchedMatchFromDb); 
            return convertMatchTimestampsToStrings(fetchedMatchFromDb);
        } else {
            setMatchDetails(null);
            return null;
        }
    } catch (error) {
        console.error("Error loading match in context:", error);
        setMatchDetails(null);
        return null;
    }
  }, [setMatchDetails]);

  const startNewMatch = useCallback(async (
    partialMatchData: Partial<Match> & { tossWinnerName?: string, electedTo?: "Bat" | "Bowl" }
    ): Promise<Match | null> => {
    console.log('[MatchContext] startNewMatch called with:', partialMatchData);
    try {
        const teamAName = partialMatchData.teamAName || "Team A";
        const teamBName = partialMatchData.teamBName || "Team B";
        const teamASquad = partialMatchData.teamASquad || Array.from({ length: SQUAD_SIZE }, (_, i) => `${teamAName} Player ${i + 1}`);
        const teamBSquad = partialMatchData.teamBSquad || Array.from({ length: SQUAD_SIZE }, (_, i) => `${teamBName} Player ${i + 1}`);

        let matchDate = partialMatchData.date || new Date().toISOString();
        let status: Match['status'] = "Upcoming";
        let innings1Record: InningsRecord | null = null;
        let currentBattingTeam: string | undefined = undefined;

        if (partialMatchData.tossWinnerName && partialMatchData.electedTo) {
            status = "Live";
            matchDate = new Date().toISOString(); // If toss happens, match is "now"
            const battingFirstTeam = partialMatchData.electedTo === "Bat" ? partialMatchData.tossWinnerName : (partialMatchData.tossWinnerName === teamAName ? teamBName : teamAName);
            const bowlingFirstTeam = battingFirstTeam === teamAName ? teamBName : teamASquad;
            
            const battingSquad = battingFirstTeam === teamAName ? teamASquad : teamBSquad;
            const bowlingSquadForInit = battingFirstTeam === teamAName ? teamBSquad : teamASquad;

            innings1Record = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquadForInit);
            currentBattingTeam = battingFirstTeam;
        }

        const newMatchData: Partial<Match> = {
            ...partialMatchData,
            date: matchDate,
            teamAName,
            teamBName,
            teamASquad,
            teamBSquad,
            status,
            innings1Record: innings1Record,
            current_batting_team: currentBattingTeam,
        };
        const createdMatchFromDb = await createMatch(newMatchData);
        console.log('[MatchContext] Match CREATED/STARTED by dataService:', createdMatchFromDb);

        if (createdMatchFromDb) {
          setMatchDetails(createdMatchFromDb); 
          if(status === "Live") { // Set context state for live match
            setState(prevState => ({
                ...prevState,
                currentInningsNumber: 1,
                target: null,
            }));
          }
        } else {
          console.error('[MatchContext] createMatch returned null or undefined.');
        }
        return convertMatchTimestampsToStrings(createdMatchFromDb);
    } catch (error) {
        console.error("[MatchContext] Error starting new match in context:", error);
        return null;
    }
  }, [setMatchDetails]);

  const updateTossAndStartInnings = useCallback(async (tossWinner: string, elected: "Bat" | "Bowl") => {
    if (!state.matchDetails) throw new Error("Match details not available for toss update.");
    console.log('[MatchContext] updateTossAndStartInnings. Toss Winner:', tossWinner, 'Elected:', elected);

    const match = state.matchDetails;
    const battingFirstTeam = elected === "Bat" ? tossWinner : (tossWinner === match.teamAName ? match.teamBName : match.teamAName);
    const bowlingFirstTeam = battingFirstTeam === match.teamAName ? match.teamBName : match.teamAName;
    
    const battingSquad = battingFirstTeam === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);
    const bowlingSquad = bowlingFirstTeam === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);

    const innings1 = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquad);

    const updatedMatchData: Match = {
        ...(match as Match),
        tossWinnerName: tossWinner,
        electedTo: elected,
        status: "Live", 
        innings1Record: innings1,
        current_batting_team: battingFirstTeam,
    };
    
    try {
        const savedMatchFromDb = await updateMatch(match.id, updatedMatchData);
        setMatchDetails(savedMatchFromDb);
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

    let match = { ...state.matchDetails } as Match;
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
        if (event.isWicket && event.bowlerName === state.currentBowlerName && event.wicketType !== DismissalType.RUN_OUT && event.wicketType !== DismissalType.RETIRED_HURT && event.wicketType !== DismissalType.TIMED_OUT && event.wicketType !== DismissalType.HANDLED_BALL && event.wicketType !== DismissalType.OBSTRUCTING_FIELD && event.wicketType !== DismissalType.HIT_BALL_TWICE) { 
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
    
    setState(prevState => ({ ...prevState, matchDetails: { ...match } })); 
    await saveMatchState({ ...match });

  }, [state]);

  const switchInnings = useCallback(async () => {
    if (!state.matchDetails || !state.matchDetails.innings1Record || state.currentInningsNumber !== 1) return;
    console.log('[MatchContext] switchInnings called.');
    
    let match = { ...state.matchDetails } as Match;
    const newTarget = match.innings1Record.totalRuns + 1;

    const battingSecondTeam = match.current_batting_team === match.teamAName ? match.teamBName : match.teamAName;

    const battingSquad = battingSecondTeam === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);
    const bowlingSquad = match.current_batting_team === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);

    match.innings2Record = initializeInningsRecord(battingSecondTeam, battingSquad, bowlingSquad);
    match.current_batting_team = battingSecondTeam; 

    setState(prevState => ({
        ...prevState,
        matchDetails: { ...match },
        currentInningsNumber: 2,
        target: newTarget,
        currentStrikerName: null, 
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState({ ...match });
  }, [state]);

  const saveMatchState = useCallback(async (matchToSaveParam?: Match | null) => {
    const matchDataToSave = matchToSaveParam || state.matchDetails; 
    if (!matchDataToSave) {
        console.warn("[MatchContext] saveMatchState: No match data to save.");
        return;
    }
    console.log('[MatchContext] saveMatchState called for match ID:', matchDataToSave.id);

    const finalMatchData: Partial<Match> = {
        ...matchDataToSave,
        current_striker_name: state.currentStrikerName,
        current_non_striker_name: state.currentNonStrikerName,
        current_bowler_name: state.currentBowlerName,
    };
    
    try {
        const savedMatchFromDb = await updateMatch(finalMatchData.id!, finalMatchData);
        if (state.matchDetails && savedMatchFromDb && savedMatchFromDb.id === state.matchDetails.id) {
           setMatchDetails(savedMatchFromDb); 
        }
    } catch (error) {
        console.error("Error saving match state:", error);
    }
  }, [state.matchDetails, state.currentStrikerName, state.currentNonStrikerName, state.currentBowlerName, setMatchDetails]);


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
