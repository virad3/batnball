

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, BallEvent, InningsRecord, PlayerBattingStats, PlayerBowlingStats, DismissalType, MatchContextType, MatchState, Team, MatchFormat } from '../types';
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
        // Ensure state is updated with the version from DB (especially if timestamps were converted by Firestore)
        // Check if the currently loaded match is still the one being saved to avoid race conditions.
        if (state.matchDetails && savedMatchFromDb && savedMatchFromDb.id === state.matchDetails.id) {
           setMatchDetails(savedMatchFromDb); 
        }
    } catch (error) {
        console.error("Error saving match state:", error);
    }
  }, [state.matchDetails, state.currentStrikerName, state.currentNonStrikerName, state.currentBowlerName, setMatchDetails]);


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
        let currentBattingTeam: string | undefined = undefined; // Local variable for logic

        if (partialMatchData.tossWinnerName && partialMatchData.electedTo) {
            status = "Live";
            matchDate = new Date().toISOString(); 
            const battingFirstTeam = partialMatchData.electedTo === "Bat" ? partialMatchData.tossWinnerName : (partialMatchData.tossWinnerName === teamAName ? teamBName : teamAName);
            
            const battingSquad = battingFirstTeam === teamAName ? teamASquad : teamBSquad;
            const bowlingSquadForInit = battingFirstTeam === teamAName ? teamBSquad : teamASquad;

            innings1Record = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquadForInit);
            currentBattingTeam = battingFirstTeam; // Local var set
        }
        
        const defaultOvers = (partialMatchData.format || MatchFormat.T20) === MatchFormat.TEST ? null : 20;

        const newMatchData: Partial<Match> = {
            teamAName: teamAName,
            teamBName: teamBName,
            teamASquad: teamASquad,
            teamBSquad: teamBSquad,
            venue: partialMatchData.venue || "Default Venue",
            format: partialMatchData.format || MatchFormat.T20,
            overs_per_innings: partialMatchData.overs_per_innings !== undefined ? partialMatchData.overs_per_innings : defaultOvers,
            tournament_id: partialMatchData.tournament_id !== undefined ? partialMatchData.tournament_id : null,

            date: matchDate, 
            status: status, 
            innings1Record: innings1Record, 
            current_batting_team: status === "Live" && currentBattingTeam ? currentBattingTeam : null,

            tossWinnerName: status === "Live" && partialMatchData.tossWinnerName ? partialMatchData.tossWinnerName : null,
            electedTo: status === "Live" && partialMatchData.electedTo ? partialMatchData.electedTo : null,
            
            innings2Record: null,
            result_summary: null,
            current_striker_name: null,
            current_non_striker_name: null,
            current_bowler_name: null,
        };
        
        const createdMatchFromDb = await createMatch(newMatchData);
        console.log('[MatchContext] Match CREATED/STARTED by dataService:', createdMatchFromDb);

        if (createdMatchFromDb) {
          setMatchDetails(createdMatchFromDb); 
          if(status === "Live") { 
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
    const bowlingSquad = bowlingFirstTeam === match.teamAName ? (match.teamBSquad || []) : (match.teamASquad || []);


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
    if (!state.matchDetails || !state.currentStrikerName || !state.currentBowlerName || !state.currentNonStrikerName) {
        console.warn("Cannot add ball: Match details, striker, non-striker, or bowler missing.");
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
    currentInningsRec.timeline = [...(currentInningsRec.timeline || []), { ...event, ballId: Date.now().toString() + Math.random().toString(36).substring(2,7) }];


    const bowlerStats = currentInningsRec.bowlingPerformances.find(p => p.playerName === state.currentBowlerName);
    if (bowlerStats) {
        if (event.extraType !== "Wide" && event.extraType !== "NoBall") { 
            bowlerStats.ballsBowled += 1;
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
    
    let isLegalDelivery = true;
    if (event.extraType === "Wide" || event.extraType === "NoBall") {
       isLegalDelivery = false;
    }
    if (isLegalDelivery) {
       currentInningsRec.totalBallsBowled +=1;
    }
    
    const totalOversWhole = Math.floor(currentInningsRec.totalBallsBowled / 6);
    const totalBallsRemainder = currentInningsRec.totalBallsBowled % 6;
    currentInningsRec.totalOversBowled = parseFloat(`${totalOversWhole}.${totalBallsRemainder}`);
    
    // Update bowler's overs after ballsBowled is updated
    if (bowlerStats && isLegalDelivery) {
        const bowlerOversWhole = Math.floor(bowlerStats.ballsBowled / 6);
        const bowlerBallsRemainder = bowlerStats.ballsBowled % 6;
        bowlerStats.oversBowled = parseFloat(`${bowlerOversWhole}.${bowlerBallsRemainder}`);
    }


    // Strike Rotation Logic
    let newStriker = state.currentStrikerName;
    let newNonStriker = state.currentNonStrikerName;

    if (isLegalDelivery && (event.runs === 1 || event.runs === 3 || event.runs === 5) && event.extraType !== "Byes" && event.extraType !== "LegByes") {
        newStriker = state.currentNonStrikerName;
        newNonStriker = state.currentStrikerName;
    }

    // End of Over Strike Rotation (if it's a legal delivery that completes an over)
    const isOverComplete = isLegalDelivery && (currentInningsRec.totalBallsBowled % 6 === 0) && currentInningsRec.totalBallsBowled > 0;
    const isMatchOver = (currentInningsRec.totalWickets >= SQUAD_SIZE - 1) || 
                       (match.overs_per_innings && currentInningsRec.totalOversBowled >= match.overs_per_innings && state.currentInningsNumber === 2); // Simplified match end condition

    if (isOverComplete && !isMatchOver) {
        newStriker = state.currentNonStrikerName; // Non-striker faces next over
        newNonStriker = state.currentStrikerName;
        // Bowler change will be handled manually via setPlayerRoles if needed
    }

    // Update match state
    if (state.currentInningsNumber === 1) {
        match.innings1Record = currentInningsRec;
    } else {
        match.innings2Record = currentInningsRec;
    }
    match.current_striker_name = newStriker;
    match.current_non_striker_name = newNonStriker;
    
    setState(prevState => ({ 
        ...prevState, 
        matchDetails: { ...match },
        currentStrikerName: newStriker,
        currentNonStrikerName: newNonStriker,
    })); 
    await saveMatchState();

  }, [state, saveMatchState]);


  const updateBallEvent = useCallback(async (ballTimelineIndex: number, updatedEventData: BallEvent) => {
    if (!state.matchDetails) {
        console.error("Match details not loaded, cannot update ball event.");
        return;
    }
    console.log(`[MatchContext] updateBallEvent for timeline index: ${ballTimelineIndex}`, updatedEventData);

    let matchCopy = JSON.parse(JSON.stringify(state.matchDetails)) as Match;
    let inningsToUpdate: InningsRecord | null | undefined = state.currentInningsNumber === 1 
        ? matchCopy.innings1Record 
        : matchCopy.innings2Record;

    if (!inningsToUpdate || !inningsToUpdate.timeline) {
        console.error("Innings record or timeline not found for update.");
        return;
    }

    // --- 1. Update the specific ball in the timeline ---
    inningsToUpdate.timeline[ballTimelineIndex] = { ...updatedEventData, ballId: inningsToUpdate.timeline[ballTimelineIndex].ballId || Date.now().toString() };

    // --- 2. Reset innings and player stats ---
    const battingSquad = state.currentInningsNumber === 1 
        ? (matchCopy.teamASquad?.includes(inningsToUpdate.teamName) ? matchCopy.teamASquad : matchCopy.teamBSquad)
        : (matchCopy.teamBSquad?.includes(inningsToUpdate.teamName) ? matchCopy.teamBSquad : matchCopy.teamASquad);

    const bowlingSquad = state.currentInningsNumber === 1 
        ? (matchCopy.teamASquad?.includes(inningsToUpdate.teamName) ? matchCopy.teamBSquad : matchCopy.teamASquad)
        : (matchCopy.teamBSquad?.includes(inningsToUpdate.teamName) ? matchCopy.teamASquad : matchCopy.teamBSquad);
        
    const freshInnings = initializeInningsRecord(inningsToUpdate.teamName, battingSquad, bowlingSquad);
    inningsToUpdate.totalRuns = freshInnings.totalRuns;
    inningsToUpdate.totalWickets = freshInnings.totalWickets;
    inningsToUpdate.totalOversBowled = freshInnings.totalOversBowled;
    inningsToUpdate.totalBallsBowled = freshInnings.totalBallsBowled;
    inningsToUpdate.battingPerformances = freshInnings.battingPerformances;
    inningsToUpdate.bowlingPerformances = freshInnings.bowlingPerformances;
    
    const originalTimeline = [...inningsToUpdate.timeline]; // Keep a copy
    inningsToUpdate.timeline = []; // Temporarily clear for recalculation


    // --- 3. Recalculate stats by replaying the modified timeline ---
    for (const ball of originalTimeline) {
        if (!ball.strikerName || !ball.bowlerName) {
            console.warn("Skipping ball in recalculation due to missing striker/bowler:", ball);
            inningsToUpdate.timeline.push(ball); // Add back to timeline even if skipped for stats
            continue;
        }
        
        inningsToUpdate.timeline.push(ball); // Add ball to the recalculated timeline

        const bowlerStats = inningsToUpdate.bowlingPerformances.find(p => p.playerName === ball.bowlerName);
        if (bowlerStats) {
            if (ball.extraType !== "Wide" && ball.extraType !== "NoBall") {
                bowlerStats.ballsBowled += 1;
            }
            bowlerStats.runsConceded += ball.runs + (ball.extraRuns || 0);
            if (ball.isWicket && ball.bowlerName === ball.bowlerName && ball.wicketType !== DismissalType.RUN_OUT && ball.wicketType !== DismissalType.RETIRED_HURT && ball.wicketType !== DismissalType.TIMED_OUT && ball.wicketType !== DismissalType.HANDLED_BALL && ball.wicketType !== DismissalType.OBSTRUCTING_FIELD && ball.wicketType !== DismissalType.HIT_BALL_TWICE) {
                bowlerStats.wickets += 1;
            }
        }

        const strikerStats = inningsToUpdate.battingPerformances.find(p => p.playerName === ball.strikerName);
        if (strikerStats) {
            if (ball.extraType !== "Wide") {
                 if (ball.extraType !== "Byes" && ball.extraType !== "LegByes") {
                    strikerStats.runs += ball.runs;
                    if (ball.runs === 4) strikerStats.fours += 1;
                    if (ball.runs === 6) strikerStats.sixes += 1;
                 }
            }
            if (ball.extraType !== "Wide" && ball.extraType !== "NoBall") {
                strikerStats.ballsFaced += 1;
            }
            if (ball.isWicket && ball.batsmanOutName === ball.strikerName) {
                strikerStats.status = ball.wicketType || DismissalType.OTHER;
                strikerStats.bowlerName = ball.bowlerName;
                strikerStats.fielderName = ball.fielderName;
                inningsToUpdate.totalWickets += 1;
            }
        }
        
        if (ball.extraType !== "Byes" && ball.extraType !== "LegByes") {
            inningsToUpdate.totalRuns += ball.runs;
        }
        inningsToUpdate.totalRuns += (ball.extraRuns || 0);
        
        if (ball.extraType !== "Wide" && ball.extraType !== "NoBall") {
           inningsToUpdate.totalBallsBowled +=1;
        }
    }
    
    // Finalize overs calculation for innings and bowlers after loop
    const totalOversWholeRecalc = Math.floor(inningsToUpdate.totalBallsBowled / 6);
    const totalBallsRemainderRecalc = inningsToUpdate.totalBallsBowled % 6;
    inningsToUpdate.totalOversBowled = parseFloat(`${totalOversWholeRecalc}.${totalBallsRemainderRecalc}`);

    inningsToUpdate.bowlingPerformances.forEach(bs => {
        const bowlerOversWhole = Math.floor(bs.ballsBowled / 6);
        const bowlerBallsRemainder = bs.ballsBowled % 6;
        bs.oversBowled = parseFloat(`${bowlerOversWhole}.${bowlerBallsRemainder}`);
    });


    // --- 4. Update state and save ---
    if (state.currentInningsNumber === 1) {
        matchCopy.innings1Record = inningsToUpdate;
    } else {
        matchCopy.innings2Record = inningsToUpdate;
    }

    setMatchDetails(matchCopy); // This will call convertMatchTimestampsToStrings
    await saveMatchState(matchCopy); 

  }, [state.matchDetails, state.currentInningsNumber, initializeInningsRecord, setMatchDetails, saveMatchState]);


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
    match.current_striker_name = null; // Reset for new innings
    match.current_non_striker_name = null;
    match.current_bowler_name = null;

    setState(prevState => ({
        ...prevState,
        matchDetails: { ...match },
        currentInningsNumber: 2,
        target: newTarget,
        currentStrikerName: null, 
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState();
  }, [state, saveMatchState]);


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
        updateBallEvent,
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
