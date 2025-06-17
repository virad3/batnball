
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, Team, Player, BallEvent, Innings, MatchState, MatchContextType } from '../types';
import { mockTeams, mockPlayers } from '../services/dataService'; // Assuming these are exported

const initialMatchState: MatchState = {
  matchId: null,
  innings1: null,
  innings2: null,
  currentInnings: 1,
  battingTeam: null,
  bowlingTeam: null,
  striker: null,
  nonStriker: null,
  bowler: null,
  target: null,
  matchDetails: null,
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matchState, setMatchState] = useState<MatchState>(initialMatchState);

  const setMatchDetails = useCallback((match: Match) => {
    setMatchState(prevState => ({
        ...prevState,
        matchDetails: match,
        matchId: match.id,
    }));
  }, []);
  
  const startMatch = useCallback((matchId: string, tossWinner: Team, electedTo: "Bat" | "Bowl", matchInfo: Match) => {
    const battingFirstTeam = electedTo === "Bat" ? tossWinner : (tossWinner.id === matchInfo.teamA.id ? matchInfo.teamB : matchInfo.teamA);
    const bowlingFirstTeam = electedTo === "Bowl" ? tossWinner : (tossWinner.id === matchInfo.teamA.id ? matchInfo.teamB : matchInfo.teamA);

    setMatchState({
      ...initialMatchState,
      matchId,
      matchDetails: matchInfo,
      battingTeam: battingFirstTeam,
      bowlingTeam: bowlingFirstTeam,
      innings1: { team: battingFirstTeam, score: 0, wickets: 0, overs: 0, balls: 0, timeline: [] },
      currentInnings: 1,
      // Initialize with placeholder players if available, or prompt scorer to select
      striker: battingFirstTeam.players?.[0] || mockPlayers[0], 
      nonStriker: battingFirstTeam.players?.[1] || mockPlayers[1],
      bowler: bowlingFirstTeam.players?.[0] || mockPlayers[2],
    });
  }, []);

  const addBall = useCallback((event: BallEvent) => {
    setMatchState(prevState => {
      if (!prevState.battingTeam || !prevState.bowlingTeam) return prevState;

      const currentInningsState = prevState.currentInnings === 1 ? prevState.innings1 : prevState.innings2;
      if (!currentInningsState) return prevState;

      const newTimeline = [...currentInningsState.timeline, event];
      let newScore = currentInningsState.score + event.runs + (event.extraRuns || 0);
      let newWickets = currentInningsState.wickets + (event.isWicket ? 1 : 0);
      let newBalls = currentInningsState.balls + (event.extraType === "Wide" || event.extraType === "NoBall" ? 0 : 1);
      
      const oversCompleted = Math.floor(newBalls / 6);
      const ballsThisOver = newBalls % 6;

      const updatedInnings: Innings = {
        ...currentInningsState,
        score: newScore,
        wickets: newWickets,
        overs: oversCompleted,
        balls: newBalls,
        timeline: newTimeline,
      };
      
      let newStriker = prevState.striker;
      let newNonStriker = prevState.nonStriker;

      // Basic rotation logic (simplified)
      if (event.runs % 2 !== 0 && (event.extraType !== "Wide" && event.extraType !== "NoBall")) { // Odd runs
        [newStriker, newNonStriker] = [newNonStriker, newStriker];
      }
      if (ballsThisOver === 0 && newBalls > 0 && (event.extraType !== "Wide" && event.extraType !== "NoBall")) { // End of over
        [newStriker, newNonStriker] = [newNonStriker, newStriker];
        // TODO: Prompt for new bowler
      }
      if(event.isWicket) {
        // TODO: Prompt for new batsman
      }


      if (prevState.currentInnings === 1) {
        return { ...prevState, innings1: updatedInnings, striker: newStriker, nonStriker: newNonStriker };
      } else {
        return { ...prevState, innings2: updatedInnings, striker: newStriker, nonStriker: newNonStriker };
      }
    });
  }, []);

  const switchInnings = useCallback(() => {
    setMatchState(prevState => {
      if (prevState.currentInnings === 2 || !prevState.innings1 || !prevState.battingTeam || !prevState.bowlingTeam || !prevState.matchDetails) return prevState;
      
      const newBattingTeam = prevState.bowlingTeam;
      const newBowlingTeam = prevState.battingTeam;

      return {
        ...prevState,
        currentInnings: 2,
        battingTeam: newBattingTeam,
        bowlingTeam: newBowlingTeam,
        target: (prevState.innings1?.score || 0) + 1,
        innings2: { team: newBattingTeam, score: 0, wickets: 0, overs: 0, balls: 0, timeline: [] },
        striker: newBattingTeam.players?.[0] || mockPlayers[0], // Reset players
        nonStriker: newBattingTeam.players?.[1] || mockPlayers[1],
        bowler: newBowlingTeam.players?.[0] || mockPlayers[2],
      };
    });
  }, []);


  return (
    <MatchContext.Provider value={{ ...matchState, setMatchDetails, startMatch, addBall, switchInnings }}>
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
