
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Match, BallEvent, Innings, MatchState, MatchContextType } from '../types';

const initialMatchState: MatchState = {
  matchId: null,
  innings1: null,
  innings2: null,
  currentInnings: 1,
  battingTeamName: null,
  bowlingTeamName: null,
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
  
  const startMatch = useCallback((matchId: string, tossWinnerName: string, electedTo: "Bat" | "Bowl", matchInfo: Match) => {
    const battingFirstTeamName = electedTo === "Bat" ? tossWinnerName : (tossWinnerName === matchInfo.teamAName ? matchInfo.teamBName : matchInfo.teamAName);
    const bowlingFirstTeamName = electedTo === "Bowl" ? tossWinnerName : (tossWinnerName === matchInfo.teamAName ? matchInfo.teamBName : matchInfo.teamAName);

    setMatchState({
      ...initialMatchState,
      matchId,
      matchDetails: matchInfo,
      battingTeamName: battingFirstTeamName,
      bowlingTeamName: bowlingFirstTeamName,
      innings1: { teamName: battingFirstTeamName, score: 0, wickets: 0, overs: 0, balls: 0, timeline: [] },
      currentInnings: 1,
    });
  }, []);

  const addBall = useCallback((event: BallEvent) => {
    setMatchState(prevState => {
      if (!prevState.battingTeamName || !prevState.bowlingTeamName) return prevState;

      const currentInningsState = prevState.currentInnings === 1 ? prevState.innings1 : prevState.innings2;
      if (!currentInningsState) return prevState;

      const newTimeline = [...currentInningsState.timeline, event];
      let newScore = currentInningsState.score + event.runs + (event.extraRuns || 0);
      let newWickets = currentInningsState.wickets + (event.isWicket ? 1 : 0);
      let newBalls = currentInningsState.balls + (event.extraType === "Wide" || event.extraType === "NoBall" ? 0 : 1);
      
      const oversCompleted = Math.floor(newBalls / 6);
      // const ballsThisOver = newBalls % 6; // This is part of Score type, calculated there or in ScoreDisplay

      const updatedInnings: Innings = {
        ...currentInningsState,
        score: newScore,
        wickets: newWickets,
        overs: oversCompleted,
        balls: newBalls, // total balls in innings
        timeline: newTimeline,
      };
      
      // Player specific logic (striker rotation, new batsman) removed.

      if (prevState.currentInnings === 1) {
        return { ...prevState, innings1: updatedInnings };
      } else {
        return { ...prevState, innings2: updatedInnings };
      }
    });
  }, []);

  const switchInnings = useCallback(() => {
    setMatchState(prevState => {
      if (prevState.currentInnings === 2 || !prevState.innings1 || !prevState.battingTeamName || !prevState.bowlingTeamName || !prevState.matchDetails) return prevState;
      
      const newBattingTeamName = prevState.bowlingTeamName;
      const newBowlingTeamName = prevState.battingTeamName;

      return {
        ...prevState,
        currentInnings: 2,
        battingTeamName: newBattingTeamName,
        bowlingTeamName: newBowlingTeamName,
        target: (prevState.innings1?.score || 0) + 1,
        innings2: { teamName: newBattingTeamName, score: 0, wickets: 0, overs: 0, balls: 0, timeline: [] },
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
