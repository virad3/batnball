
export enum MatchFormat {
  T20 = "T20",
  ODI = "ODI",
  TEST = "Test",
  CUSTOM = "Custom"
}

export enum TournamentFormat {
  KNOCKOUT = "Knockout",
  LEAGUE = "League",
  ROUND_ROBIN = "Round Robin"
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  players?: Player[]; // Optional for now
}

export interface Player {
  id: string;
  name: string;
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
  profilePicUrl?: string;
  // Basic stats
  runsScored?: number;
  wicketsTaken?: number;
  matchesPlayed?: number;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  date: string; // ISO string or Date object
  venue: string;
  format: MatchFormat;
  status: "Upcoming" | "Live" | "Completed";
  tossWinner?: Team;
  electedTo?: "Bat" | "Bowl";
  overs?: number; // Max overs for limited over matches
  currentScore?: Score; // Simplified for now
  result?: string; // e.g., "Team A won by 5 wickets"
}

export interface Score {
  runs: number;
  wickets: number;
  overs: number; // Overs completed
  ballsThisOver: number; // Balls bowled in the current over
  battingTeam: Team;
  bowlingTeam: Team;
  currentStriker?: Player;
  currentNonStriker?: Player;
  currentBowler?: Player;
}

export interface BallEvent {
  runs: number; // 0-6
  isWicket: boolean;
  wicketType?: "Bowled" | "Caught" | "LBW" | "Run Out" | "Stumped" | "Hit Wicket" | "Other";
  extraType?: "Wide" | "NoBall" | "Byes" | "LegByes";
  extraRuns?: number;
  batsman: Player; // Player who faced the ball or was out
  bowler: Player;
  fielder?: Player; // For caught/run out/stumped
  commentary?: string; // Auto-generated or manual
}

export interface Innings {
  team: Team;
  score: number;
  wickets: number;
  overs: number;
  balls: number; // Total balls bowled in the innings
  timeline: BallEvent[];
  // Could add fallOfWickets, partnerships etc.
}


export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  teams: Team[];
  matches?: Match[];
  organizer?: UserProfile; // Link to organizer profile
  logoUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string; // Optional, might not be public
  profileType: "Player" | "Scorer" | "Organizer" | "Fan";
  followedPlayers?: Player[];
  followedTeams?: Team[];
  achievements?: string[]; // e.g., "MVP - Summer League 2023"
  profilePicUrl?: string;
}

// For Gemini Service
export interface GeneratedCommentary {
  ballByBall: string;
  summary?: string;
}

// Match context types
export interface MatchState {
  matchId: string | null;
  innings1: Innings | null;
  innings2: Innings | null;
  currentInnings: 1 | 2;
  battingTeam: Team | null;
  bowlingTeam: Team | null;
  striker: Player | null;
  nonStriker: Player | null;
  bowler: Player | null;
  target: number | null; // For 2nd innings
  matchDetails: Match | null; // Full match details
}

export interface MatchContextType extends MatchState {
  setMatchDetails: (match: Match) => void;
  startMatch: (matchId: string, tossWinner: Team, electedTo: "Bat" | "Bowl", matchInfo: Match) => void;
  addBall: (event: BallEvent) => void;
  switchInnings: () => void;
  // other actions
}
