
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, BallEvent, InningsRecord, PlayerBattingStats, PlayerBowlingStats, DismissalType, MatchContextType, MatchState } from '../types';
import { createMatch, getMatchById, updateMatch } from '../services/dataService'; // Now uses Firebase
import { Timestamp } from 'firebase/firestore'; // Ensure Timestamp is imported

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

  // Helper to convert Firestore Timestamps in Match object to ISO strings for consistent client-side use
  // The output Match object will have its 'date' field as a string.
  const convertMatchTimestampsToStrings = (matchWithPotentialTimestamp: Match | null): Match | null => {
    if (!matchWithPotentialTimestamp) return null;
    
    let processedDate: string;
    if (matchWithPotentialTimestamp.date instanceof Timestamp) {
        processedDate = matchWithPotentialTimestamp.date.toDate().toISOString();
    } else if (typeof matchWithPotentialTimestamp.date === 'string') {
        processedDate = matchWithPotentialTimestamp.date;
    } else {
        // Fallback for unexpected date type (e.g. null/undefined despite typing)
        console.warn("Match date in unexpected format during conversion:", matchWithPotentialTimestamp.date);
        processedDate = new Date().toISOString(); 
    }

    return {
      ...matchWithPotentialTimestamp,
      date: processedDate,
      // Add other timestamp fields if any and process them similarly
    };
  };
  // Helper to convert string dates back to Timestamps before saving (if dataService doesn't handle it)
  // For now, dataService handles Timestamp conversion for known date fields.

  const setMatchDetails = useCallback((match: Match | null) => {
    console.log('[MatchContext] setMatchDetails called with:', match);
    const processedMatch = convertMatchTimestampsToStrings(match); // Ensures match.date is string
    setState(prevState => ({
        ...prevState,
        matchDetails: processedMatch, // Now matchDetails.date is definitely a string
        currentInningsNumber: processedMatch?.innings2Record ? 2 : 1, 
        target: processedMatch?.innings1Record ? processedMatch.innings1Record.totalRuns + 1 : null,
        currentStrikerName: processedMatch ? prevState.currentStrikerName : null, 
        currentNonStrikerName: processedMatch ? prevState.currentNonStrikerName : null,
        currentBowlerName: processedMatch ? prevState.currentBowlerName : null,
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
        const fetchedMatchFromDb = await getMatchById(matchId); // Uses Firebase, date might be Timestamp
        console.log('[MatchContext] fetchedMatch from dataService:', fetchedMatchFromDb);
        
        if (fetchedMatchFromDb) {
            // setMatchDetails will call convertMatchTimestampsToStrings
            setMatchDetails(fetchedMatchFromDb); 
            setState(prevState => ({ // Ensure other state elements are also updated if dependent on fetchedMatchFromDb
                ...prevState,
                currentStrikerName: fetchedMatchFromDb.current_striker_name || null,
                currentNonStrikerName: fetchedMatchFromDb.current_non_striker_name || null,
                currentBowlerName: fetchedMatchFromDb.current_bowler_name || null,
                currentInningsNumber: fetchedMatchFromDb.innings2Record ? 2 : (fetchedMatchFromDb.innings1Record ? 1 : 1),
                target: fetchedMatchFromDb.innings1Record ? fetchedMatchFromDb.innings1Record.totalRuns + 1 : null,
            }));
             return convertMatchTimestampsToStrings(fetchedMatchFromDb); // Return the processed match for external use if needed
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

  const startNewMatch = useCallback(async (partialMatchData: Partial<Match>): Promise<Match | null> => {
    console.log('[MatchContext] startNewMatch called with partialMatchData:', partialMatchData);
    try {
        const newMatchData: Partial<Match> = {
            status: "Upcoming",
            teamASquad: [],
            teamBSquad: [],
            ...partialMatchData,
            // Date is handled by createMatch in dataService if not provided or needs conversion
            // createMatch in dataService should store as Timestamp
        };
        const createdMatchFromDb = await createMatch(newMatchData); // Uses Firebase, date will be Timestamp
        console.log('[MatchContext] Match CREATED by dataService in startNewMatch:', createdMatchFromDb);

        if (createdMatchFromDb) {
          setMatchDetails(createdMatchFromDb); // This will convert date to string for the state
        } else {
          console.error('[MatchContext] createMatch returned null or undefined. Cannot set details.');
        }
        return convertMatchTimestampsToStrings(createdMatchFromDb); // Return processed match
    } catch (error) {
        console.error("[MatchContext] Error starting new match in context:", error);
        return null;
    }
  }, [setMatchDetails]);

  const updateTossAndStartInnings = useCallback(async (tossWinner: string, elected: "Bat" | "Bowl") => {
    if (!state.matchDetails) throw new Error("Match details not available");
    console.log('[MatchContext] updateTossAndStartInnings. Toss Winner:', tossWinner, 'Elected:', elected);

    const match = state.matchDetails; // match.date here is already a string due to convertMatchTimestampsToStrings
    const battingFirstTeam = elected === "Bat" ? tossWinner : (tossWinner === match.teamAName ? match.teamBName : match.teamAName);
    const bowlingFirstTeam = battingFirstTeam === match.teamAName ? match.teamBName : match.teamAName;
    
    const battingSquad = battingFirstTeam === match.teamAName ? match.teamASquad : match.teamBSquad;
    const bowlingSquad = bowlingFirstTeam === match.teamAName ? match.teamASquad : match.teamBSquad; // Bowling squad is opponent

    const innings1 = initializeInningsRecord(battingFirstTeam, battingSquad, bowlingSquad);

    // Prepare data for updateMatch. dataService.updateMatch expects date to be potentially string for conversion.
    const updatedMatchData: Match = {
        ...(match as Match), // Cast to ensure type compatibility if matchDetails is stringified
        tossWinnerName: tossWinner,
        electedTo: elected,
        status: "Live",
        innings1Record: innings1,
        current_batting_team: battingFirstTeam,
    };
    
    try {
        // updateMatch in dataService now handles Firebase interaction and returns updated match (date as Timestamp)
        const savedMatchFromDb = await updateMatch(match.id, updatedMatchData);
        setMatchDetails(savedMatchFromDb); // This will re-process timestamps
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

    let match = { ...state.matchDetails } as Match; // Create a mutable copy, date is string
    let currentInningsRec = state.currentInningsNumber === 1 ? match.innings1Record : match.innings2Record;

    if (!currentInningsRec) {
        console.error("Current innings record not found!");
        return;
    }
    
    // Deep clone innings record to avoid direct state mutation issues
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
            // Wicket credited to bowler for specific types
            bowlerStats.wickets += 1;
        }
    }

    const strikerStats = currentInningsRec.battingPerformances.find(p => p.playerName === state.currentStrikerName);
    if (strikerStats) {
        if (event.extraType !== "Wide") { // Runs are not added to batsman for wides
             if (event.extraType !== "Byes" && event.extraType !== "LegByes") { // Runs scored by bat
                strikerStats.runs += event.runs;
                if (event.runs === 4) strikerStats.fours += 1;
                if (event.runs === 6) strikerStats.sixes += 1;
             }
        }
        if (event.extraType !== "Wide" && event.extraType !== "NoBall") { // Ball faced unless it's a wide or no-ball that wasn't hit
            strikerStats.ballsFaced += 1;
        }

        if (event.isWicket && event.batsmanOutName === state.currentStrikerName) {
            strikerStats.status = event.wicketType || DismissalType.OTHER;
            strikerStats.bowlerName = event.bowlerName; 
            strikerStats.fielderName = event.fielderName; 
            currentInningsRec.totalWickets += 1;
        }
    }
    
    // Add runs to team total
    if (event.extraType !== "Byes" && event.extraType !== "LegByes") { // if not byes/legbyes, runs are added
        currentInningsRec.totalRuns += event.runs;
    }
    currentInningsRec.totalRuns += (event.extraRuns || 0); // Add any extra runs (e.g. from noball + run, wide + run)
    
    // Increment balls bowled for the innings (unless wide or noball that doesn't count as a ball in over)
    if (event.extraType !== "Wide" && event.extraType !== "NoBall") {
       currentInningsRec.totalBallsBowled +=1;
    }
    // Update total overs display
    const totalOversWhole = Math.floor(currentInningsRec.totalBallsBowled / 6);
    const totalBallsRemainder = currentInningsRec.totalBallsBowled % 6;
    currentInningsRec.totalOversBowled = parseFloat(`${totalOversWhole}.${totalBallsRemainder}`);


    if (state.currentInningsNumber === 1) {
        match.innings1Record = currentInningsRec;
    } else {
        match.innings2Record = currentInningsRec;
    }
    
    // Update local state immediately for responsiveness
    // match already has date as string here
    setState(prevState => ({ ...prevState, matchDetails: { ...match } })); 
    await saveMatchState({ ...match }); // Save the updated match state (with string date) to Firebase

  }, [state]); // Dependencies: state (includes matchDetails, player roles, innings number)

  const switchInnings = useCallback(async () => {
    if (!state.matchDetails || !state.matchDetails.innings1Record || state.currentInningsNumber !== 1) return;
    console.log('[MatchContext] switchInnings called.');
    
    let match = { ...state.matchDetails } as Match; // Create a mutable copy, date is string
    const newTarget = match.innings1Record.totalRuns + 1;

    const battingSecondTeam = match.current_batting_team === match.teamAName ? match.teamBName : match.teamAName;
    // const bowlingSecondTeam = match.current_batting_team!; // Team that just finished batting

    const battingSquad = battingSecondTeam === match.teamAName ? match.teamASquad : match.teamBSquad;
    const bowlingSquad = match.current_batting_team === match.teamAName ? match.teamASquad : match.teamBSquad; // Team that just finished batting is now bowling

    match.innings2Record = initializeInningsRecord(battingSecondTeam, battingSquad, bowlingSquad);
    match.current_batting_team = battingSecondTeam; 

    setState(prevState => ({
        ...prevState,
        matchDetails: { ...match }, // match already has date as string
        currentInningsNumber: 2,
        target: newTarget,
        currentStrikerName: null, 
        currentNonStrikerName: null,
        currentBowlerName: null,
    }));
    await saveMatchState({ ...match }); // Pass match with string date
  }, [state]);

  const saveMatchState = useCallback(async (matchToSaveParam?: Match | null) => {
    // matchToSaveParam might come from addBall or switchInnings, where date is already string
    const matchDataToSave = matchToSaveParam || state.matchDetails; 
    if (!matchDataToSave) {
        console.warn("[MatchContext] saveMatchState: No match data to save.");
        return;
    }
    console.log('[MatchContext] saveMatchState called for match ID:', matchDataToSave.id);

    // Ensure date is in a format Firestore expects. dataService.updateMatch handles string to Timestamp conversion.
    const finalMatchData: Partial<Match> = {
        ...matchDataToSave, // date here should be string, dataService will handle conversion
        current_striker_name: state.currentStrikerName,
        current_non_striker_name: state.currentNonStrikerName,
        current_bowler_name: state.currentBowlerName,
    };
    
    try {
        const savedMatchFromDb = await updateMatch(finalMatchData.id!, finalMatchData); // Uses Firebase, returns date as Timestamp
        // Only update context's matchDetails if the saved match is the one currently active in context
        if (state.matchDetails && savedMatchFromDb && savedMatchFromDb.id === state.matchDetails.id) {
           // setMatchDetails will convert the Timestamp date from savedMatchFromDb back to string for the state
           setMatchDetails(savedMatchFromDb); 
        }
    } catch (error) {
        console.error("Error saving match state:", error);
    }
  }, [state.matchDetails, state.currentStrikerName, state.currentNonStrikerName, state.currentBowlerName, setMatchDetails]);


  const endMatch = useCallback(async (resultSummary: string) => {
    if (!state.matchDetails) return;
    console.log('[MatchContext] endMatch called. Result:', resultSummary);
    const match = { ...state.matchDetails, status: "Completed", result_summary: resultSummary } as Match; // date is string
    setState(prevState => ({ ...prevState, matchDetails: match }));
    await saveMatchState(match); // Pass match with string date
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
