

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

// Internal helper, not exported from context directly but used by context methods
const initializeInningsRecord = (teamName: string, squad: string[] = [], oppositionSquad: string[] = []): InningsRecord => {
    const defaultSquad = Array.from({ length: SQUAD_SIZE }, (_, i) => `${teamName} Player ${i + 1}`);
    const finalSquad = squad.length >= SQUAD_SIZE ? squad.slice(0, SQUAD_SIZE) : [...squad, ...defaultSquad.slice(squad.length)].slice(0,SQUAD_SIZE);

    const defaultOpponentSquad = Array.from({ length: SQUAD_SIZE }, (_, i) => `Opponent Player ${i + 1}`);
    const finalOpponentSquad = oppositionSquad.length >= SQUAD_SIZE ? oppositionSquad.slice(0, SQUAD_SIZE) : [...oppositionSquad, ...defaultOpponentSquad.slice(oppositionSquad.length)].slice(0,SQUAD_SIZE);

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
        currentInningsNumber: processedMatch?.innings2Record ? 2 : (processedMatch?.innings1Record ? (match?.current_batting_team === match.innings1Record.teamName ? 1: 2) : 1),
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
    console.log('[MatchContext] Innings1 Runs to save:', matchDataToSave.innings1Record?.totalRuns, 'Innings2 Runs to save:', matchDataToSave.innings2Record?.totalRuns);


    const currentStriker = typeof state.currentStrikerName === 'string' ? state.currentStrikerName : null;
    const currentNonStriker = typeof state.currentNonStrikerName === 'string' ? state.currentNonStrikerName : null;
    const currentBowler = typeof state.currentBowlerName === 'string' ? state.currentBowlerName : null;


    const finalMatchData: Partial<Match> = {
        ...matchDataToSave,
        // Only override live tracking names if match is still Live. If Completed/Abandoned, these should be null from matchDataToSave.
        current_striker_name: matchDataToSave.status === "Live" ? currentStriker : null,
        current_non_striker_name: matchDataToSave.status === "Live" ? currentNonStriker : null,
        current_bowler_name: matchDataToSave.status === "Live" ? currentBowler : null,
    };

    try {
        const savedMatchFromDb = await updateMatch(matchDataToSave.id!, finalMatchData); 
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
        let currentBattingTeam: string | undefined = undefined;

        if (partialMatchData.tossWinnerName && partialMatchData.electedTo) {
            status = "Live";
            matchDate = new Date().toISOString();
            const battingFirstTeam = partialMatchData.electedTo === "Bat" ? partialMatchData.tossWinnerName : (partialMatchData.tossWinnerName === teamAName ? teamBName : teamAName);

            const battingSquad = battingFirstTeam === teamAName ? teamASquad : teamBSquad;
            const bowlingSquadForInit = battingFirstTeam === teamAName ? teamBSquad : teamASquad;

            innings1Record = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquadForInit);
            currentBattingTeam = battingFirstTeam;
        }

        const defaultOvers = (partialMatchData.format || MatchFormat.T20) === MatchFormat.TEST ? undefined : (partialMatchData.overs_per_innings ?? 20);


        const newMatchData: Partial<Match> = {
            teamAName: teamAName,
            teamBName: teamBName,
            teamASquad: teamASquad.slice(0, SQUAD_SIZE),
            teamBSquad: teamBSquad.slice(0, SQUAD_SIZE),
            venue: partialMatchData.venue || "Default Venue",
            format: partialMatchData.format || MatchFormat.T20,
            overs_per_innings: defaultOvers,
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
    const bowlingSquad = bowlingFirstTeam === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);

    const innings1 = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquad);

    const updatedMatchData: Match = {
        ...(match as Match),
        tossWinnerName: tossWinner,
        electedTo: elected,
        status: "Live",
        innings1Record: innings1,
        current_batting_team: battingFirstTeam,
        current_striker_name: null,
        current_non_striker_name: null,
        current_bowler_name: null,
    };

    try {
        const savedMatchFromDb = await updateMatch(match.id, updatedMatchData);
        setMatchDetails(savedMatchFromDb);
        setState(prevState => ({
            ...prevState,
            currentInningsNumber: 1,
            target: null,
            currentStrikerName: null,
            currentNonStrikerName: null,
            currentBowlerName: null,
        }));
    } catch (error) {
        console.error("Error updating toss and starting innings:", error);
    }

  }, [state.matchDetails, setMatchDetails]);

  const switchInnings = useCallback(async (matchToSwitch: Match) => {
    if (!matchToSwitch.innings1Record || state.currentInningsNumber !== 1) {
        console.warn("Cannot switch innings: Invalid state or match data from addBall.");
        return;
    }
    console.log('[MatchContext] switchInnings called with match:', matchToSwitch);

    let match = { ...matchToSwitch }; // Use the passed, up-to-date match object
    const newTarget = match.innings1Record.totalRuns + 1;

    // Determine batting second team based on current_batting_team of the *passed* match object
    const battingSecondTeam = match.current_batting_team === match.teamAName ? match.teamBName : match.teamAName;

    const battingSquad = battingSecondTeam === match.teamAName ? (match.teamASquad || []) : (match.teamBSquad || []);
    const bowlingSquadForInit = battingSecondTeam === match.teamAName ? (match.teamBSquad || []) : (match.teamASquad || []);


    match.innings2Record = initializeInningsRecord(battingSecondTeam, battingSquad, bowlingSquadForInit);
    match.current_batting_team = battingSecondTeam;
    match.current_striker_name = null;
    match.current_non_striker_name = null;
    match.current_bowler_name = null;

    setState(prevState => ({
        ...prevState,
        matchDetails: { ...match }, // Set the updated match object into state
        currentInningsNumber: 2,
        target: newTarget,
        currentStrikerName: null,
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState(match); // Save this updated match object
  }, [state.currentInningsNumber, saveMatchState, setState]);


  const endMatch = useCallback(async (finalCompleteMatch: Match) => {
    if (!finalCompleteMatch || !finalCompleteMatch.id) {
        console.error("[MatchContext] endMatch: finalCompleteMatch is null or invalid, cannot end match.");
        return;
    }
    console.log('[MatchContext] endMatch called. Final Match Object:', finalCompleteMatch);
    // finalCompleteMatch should already have status: "Completed", result_summary, and nulled live fields
    // set by the `addBall` function.

    setState(prevState => ({
        ...prevState,
        matchDetails: finalCompleteMatch, // Use the complete object directly
        currentStrikerName: null,
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState(finalCompleteMatch); // Pass the complete object for saving
  }, [saveMatchState, setState]);


  const addBall = useCallback(async (event: BallEvent) => {
    if (!state.matchDetails || !state.currentStrikerName || !state.currentBowlerName || !state.currentNonStrikerName) {
        console.warn("Cannot add ball: Match details, striker, non-striker, or bowler missing.");
        return;
    }
    console.log('[MatchContext] addBall event:', event);

    let match = JSON.parse(JSON.stringify(state.matchDetails)) as Match; // Deep copy
    let currentInningsRec = state.currentInningsNumber === 1 ? match.innings1Record : match.innings2Record;

    if (!currentInningsRec) {
        console.error("Current innings record not found!");
        return;
    }

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

    if (bowlerStats) {
        const bowlerOversWhole = Math.floor(bowlerStats.ballsBowled / 6);
        const bowlerBallsRemainder = bowlerStats.ballsBowled % 6;
        bowlerStats.oversBowled = parseFloat(`${bowlerOversWhole}.${bowlerBallsRemainder}`);
    }

    let newStriker = state.currentStrikerName;
    let newNonStriker = state.currentNonStrikerName;

    if (isLegalDelivery && (event.runs === 1 || event.runs === 3 || event.runs === 5) && !event.extraType) {
        newStriker = state.currentNonStrikerName;
        newNonStriker = state.currentStrikerName;
    }

    
    const isCurrentInningsActuallyOverByWicketsOrOvers = (currentInningsRec.totalWickets >= SQUAD_SIZE - 1) ||
                       (match.overs_per_innings && parseFloat(currentInningsRec.totalOversBowled.toFixed(1)) >= match.overs_per_innings);

    const isOverComplete = isLegalDelivery && (currentInningsRec.totalBallsBowled % 6 === 0) && currentInningsRec.totalBallsBowled > 0;

    if (state.currentInningsNumber === 1) {
        match.innings1Record = currentInningsRec;
    } else {
        match.innings2Record = currentInningsRec;
    }

    // Handle Match/Innings Completion
    if (state.currentInningsNumber === 1) {
        if (isCurrentInningsActuallyOverByWicketsOrOvers) { // 1st innings ends by wickets/overs
            console.log('[MatchContext] First innings completed. Switching innings.');
            // `match` object here is already updated with the current ball's effects.
            await switchInnings(match); 
            return; 
        }
    } else { // Current innings is 2nd
        const targetChased = currentInningsRec.totalRuns >= (state.target || Infinity);
        if (targetChased || isCurrentInningsActuallyOverByWicketsOrOvers) { // 2nd innings ends by target, wickets, or overs
            const { teamAName: contextTeamAName, teamBName: contextTeamBName } = match;
            const battingTeamName = currentInningsRec.teamName;
            const bowlingTeamName = contextTeamAName === battingTeamName ? contextTeamBName : contextTeamAName;
            const maxWickets = SQUAD_SIZE - 1;
            let resultSummary = "";

            if (targetChased) {
                resultSummary = `${battingTeamName} won by ${maxWickets - currentInningsRec.totalWickets} wicket(s).`;
            } else { // Innings ended by wickets/overs before target chased
                 if (currentInningsRec.totalRuns < (state.target || Infinity) - 1) {
                    resultSummary = `${bowlingTeamName} won by ${((state.target || 0) - 1) - currentInningsRec.totalRuns} run(s).`;
                } else if (currentInningsRec.totalRuns === (state.target || Infinity) - 1) {
                    resultSummary = "Match Tied.";
                } else { // Should not happen if logic above is correct
                    resultSummary = "Match Completed (Result needs review).";
                }
            }
            
            // Prepare the match object for `endMatch`
            match.status = "Completed";
            match.result_summary = resultSummary;
            match.current_batting_team = null;
            match.current_striker_name = null;
            match.current_non_striker_name = null;
            match.current_bowler_name = null;

            console.log(`[MatchContext] Match completed in 2nd innings. Result: ${resultSummary}`);
            await endMatch(match); // Pass the fully prepared Match object
            return; 
        }
    }


    // If match/innings is not over, proceed with role updates
    if (isOverComplete) { 
        newStriker = state.currentNonStrikerName;
        newNonStriker = state.currentStrikerName;
        match.current_bowler_name = null; 
    }

    if(event.isWicket && event.batsmanOutName === state.currentStrikerName) {
        newStriker = null;
    } else if (event.isWicket && event.batsmanOutName === state.currentNonStrikerName) {
        newNonStriker = null;
    }

    match.current_striker_name = newStriker;
    match.current_non_striker_name = newNonStriker;

    setState(prevState => ({
        ...prevState,
        matchDetails: { ...match },
        currentStrikerName: newStriker,
        currentNonStrikerName: newNonStriker,
        currentBowlerName: (isOverComplete) ? null : prevState.currentBowlerName,
    }));
    await saveMatchState(match);

  }, [state, saveMatchState, switchInnings, endMatch, setState]);


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

    inningsToUpdate.timeline[ballTimelineIndex] = { ...updatedEventData, ballId: inningsToUpdate.timeline[ballTimelineIndex].ballId || Date.now().toString() };

    const battingSquadForInit = inningsToUpdate.teamName === matchCopy.teamAName ? (matchCopy.teamASquad || []) : (matchCopy.teamBSquad || []);
    const bowlingSquadForInit = inningsToUpdate.teamName === matchCopy.teamAName ? (matchCopy.teamBSquad || []) : (matchCopy.teamASquad || []);

    const freshInnings = initializeInningsRecord(inningsToUpdate.teamName, battingSquadForInit, bowlingSquadForInit);
    inningsToUpdate.totalRuns = freshInnings.totalRuns;
    inningsToUpdate.totalWickets = freshInnings.totalWickets;
    inningsToUpdate.totalOversBowled = freshInnings.totalOversBowled;
    inningsToUpdate.totalBallsBowled = freshInnings.totalBallsBowled;
    inningsToUpdate.battingPerformances = freshInnings.battingPerformances;
    inningsToUpdate.bowlingPerformances = freshInnings.bowlingPerformances;

    const originalTimeline = [...inningsToUpdate.timeline];
    inningsToUpdate.timeline = []; // Reset timeline to recalculate from scratch

    for (const ball of originalTimeline) {
        if (!ball.strikerName || !ball.bowlerName) {
            console.warn("Skipping ball in recalculation due to missing striker/bowler:", ball);
            inningsToUpdate.timeline.push(ball); // Add it back if it's problematic but part of history
            continue;
        }

        inningsToUpdate.timeline.push(ball); // Add current ball to timeline being rebuilt

        const bowlerStats = inningsToUpdate.bowlingPerformances.find(p => p.playerName === ball.bowlerName);
        if (bowlerStats) {
            if (ball.extraType !== "Wide" && ball.extraType !== "NoBall") {
                bowlerStats.ballsBowled += 1;
            }
            bowlerStats.runsConceded += (Number(ball.runs) || 0) + (Number(ball.extraRuns) || 0);
            if (ball.isWicket && ball.bowlerName === ball.bowlerName && ball.wicketType !== DismissalType.RUN_OUT && ball.wicketType !== DismissalType.RETIRED_HURT && ball.wicketType !== DismissalType.TIMED_OUT && ball.wicketType !== DismissalType.HANDLED_BALL && ball.wicketType !== DismissalType.OBSTRUCTING_FIELD && ball.wicketType !== DismissalType.HIT_BALL_TWICE) {
                bowlerStats.wickets += 1;
            }
        }

        const strikerStats = inningsToUpdate.battingPerformances.find(p => p.playerName === ball.strikerName);
        if (strikerStats) {
            if (ball.extraType !== "Wide") {
                 if (ball.extraType !== "Byes" && ball.extraType !== "LegByes") {
                    strikerStats.runs += (Number(ball.runs) || 0);
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

        const runsForTotal = Number(ball.runs) || 0;
        const extraRunsForTotal = Number(ball.extraRuns) || 0;

        if (ball.extraType !== "Byes" && ball.extraType !== "LegByes") {
            inningsToUpdate.totalRuns += runsForTotal;
        }
        inningsToUpdate.totalRuns += extraRunsForTotal;

        if (ball.extraType !== "Wide" && ball.extraType !== "NoBall") {
           inningsToUpdate.totalBallsBowled +=1;
        }
    }

    const totalOversWholeRecalc = Math.floor(inningsToUpdate.totalBallsBowled / 6);
    const totalBallsRemainderRecalc = inningsToUpdate.totalBallsBowled % 6;
    inningsToUpdate.totalOversBowled = parseFloat(`${totalOversWholeRecalc}.${totalBallsRemainderRecalc}`);

    inningsToUpdate.bowlingPerformances.forEach(bs => {
        const bowlerOversWhole = Math.floor(bs.ballsBowled / 6);
        const bowlerBallsRemainder = bs.ballsBowled % 6;
        bs.oversBowled = parseFloat(`${bowlerOversWhole}.${bowlerBallsRemainder}`);
        // Maiden recalculation would need to inspect sequences of 6 balls for this bowler
    });

    if (state.currentInningsNumber === 1) {
        matchCopy.innings1Record = inningsToUpdate;
    } else {
        matchCopy.innings2Record = inningsToUpdate;
    }
    
    // Update live roles based on the last ball of the recalculated timeline
    if (inningsToUpdate.timeline.length > 0) {
        const lastBall = inningsToUpdate.timeline[inningsToUpdate.timeline.length - 1];
        let newStriker = lastBall.strikerName || null;
        // Determine non-striker based on the *current context's* non-striker, if striker hasn't changed,
        // or swap if runs imply they crossed, or null if a wicket fell.
        // This part is tricky. For simplicity, we might just re-use context's non-striker
        // or prompt user if ambiguity. For now, rely on context value before recalculation.
        let newNonStriker = state.currentNonStrikerName; // Placeholder, might need refinement

        if(lastBall.isWicket && lastBall.batsmanOutName === newStriker) newStriker = null;
        else if (lastBall.isWicket && lastBall.batsmanOutName === newNonStriker) newNonStriker = null;
        // Simplified striker rotation for now. A full over-by-over replay might be needed for perfect accuracy.
        else if (!lastBall.extraType && (lastBall.runs === 1 || lastBall.runs === 3 || lastBall.runs === 5)) {
            const temp = newStriker;
            newStriker = newNonStriker;
            newNonStriker = temp;
        }
        
        const isOverCompleteAfterEdit = (lastBall.extraType !== "Wide" && lastBall.extraType !== "NoBall") && (inningsToUpdate.totalBallsBowled % 6 === 0) && inningsToUpdate.totalBallsBowled > 0;
        if(isOverCompleteAfterEdit && !(lastBall.isWicket && (lastBall.batsmanOutName === newStriker || lastBall.batsmanOutName === newNonStriker))) {
            const temp = newStriker;
            newStriker = newNonStriker;
            newNonStriker = temp;
        }


        matchCopy.current_striker_name = newStriker;
        matchCopy.current_non_striker_name = newNonStriker; // Might need adjustment
        matchCopy.current_bowler_name = isOverCompleteAfterEdit ? null : (lastBall.bowlerName || null);


        setState(prevState => ({
            ...prevState,
            matchDetails: matchCopy,
            currentStrikerName: newStriker,
            currentNonStrikerName: newNonStriker,
            currentBowlerName: isOverCompleteAfterEdit ? null : (lastBall.bowlerName || null),
        }));

    } else { // Timeline is empty after edit (e.g., last ball deleted)
        matchCopy.current_striker_name = null;
        matchCopy.current_non_striker_name = null;
        matchCopy.current_bowler_name = null;
        setState(prevState => ({
            ...prevState,
            matchDetails: matchCopy,
            currentStrikerName: null,
            currentNonStrikerName: null,
            currentBowlerName: null
        }));
    }

    await saveMatchState(matchCopy);

  }, [state.matchDetails, state.currentInningsNumber, state.currentNonStrikerName, setMatchDetails, saveMatchState, setState]);


  const refreshActiveInningsPlayerLists = useCallback(async (
    confirmedBattingSquad: string[],
    confirmedBowlingSquad: string[]
  ) => {
    if (!state.matchDetails) {
      console.warn("[MatchContext] refreshActiveInningsPlayerLists: No matchDetails loaded.");
      return;
    }

    let matchCopy = JSON.parse(JSON.stringify(state.matchDetails)) as Match;
    let currentInningsRecToUpdate: InningsRecord | null | undefined = state.currentInningsNumber === 1
        ? matchCopy.innings1Record
        : matchCopy.innings2Record;

    if (!currentInningsRecToUpdate) {
      console.warn("[MatchContext] refreshActiveInningsPlayerLists: No active innings record found to update.");
      return;
    }

    if (currentInningsRecToUpdate.timeline && currentInningsRecToUpdate.timeline.length > 0) {
        console.warn("[MatchContext] refreshActiveInningsPlayerLists: Timeline is not empty. Full recalculation might be needed if player identities changed fundamentally. Proceeding with simple player list refresh.");
        // If a full recalculation based on new player names for existing events is needed,
        // this would be a much more complex operation, potentially involving re-mapping
        // strikerName, bowlerName, batsmanOutName, fielderName in each timeline event.
        // For now, this function assumes it's called BEFORE any balls are bowled in the innings,
        // or that player name changes don't affect already recorded timeline events.
    }

    // Re-initialize player performance arrays with the new squads
    const tempFreshInnings = initializeInningsRecord(currentInningsRecToUpdate.teamName, confirmedBattingSquad, confirmedBowlingSquad);
    currentInningsRecToUpdate.battingPerformances = tempFreshInnings.battingPerformances;
    currentInningsRecToUpdate.bowlingPerformances = tempFreshInnings.bowlingPerformances;

    // Update the correct innings record in the match copy
    if (state.currentInningsNumber === 1) {
        matchCopy.innings1Record = currentInningsRecToUpdate;
    } else {
        matchCopy.innings2Record = currentInningsRecToUpdate;
    }

    setMatchDetails(matchCopy); // Update context state
    await saveMatchState(matchCopy); // Save to database
    console.log("[MatchContext] Active innings player lists refreshed and saved.");

  }, [state.matchDetails, state.currentInningsNumber, setMatchDetails, saveMatchState]);


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
        setPlayerRoles,
        refreshActiveInningsPlayerLists
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

// Ensure this declaration matches the one in types.ts exactly
declare module '../types' {
  interface MatchContextType {
    endMatch: (finalCompleteMatch: Match) => Promise<void>; // Updated signature
    refreshActiveInningsPlayerLists: (confirmedBattingSquad: string[], confirmedBowlingSquad: string[]) => Promise<void>;
    switchInnings: (matchToSwitch: Match) => Promise<void>; 
  }
}