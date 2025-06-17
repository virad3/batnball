
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

export interface Match {
  id: string;
  teamAName: string;
  teamBName: string;
  date: string; // ISO string or Date object
  venue: string;
  format: MatchFormat;
  status: "Upcoming" | "Live" | "Completed";
  tossWinnerName?: string;
  electedTo?: "Bat" | "Bowl";
  overs?: number; // Max overs for limited over matches
  currentScore?: Score;
  result?: string; // e.g., "Team A won by 5 wickets"
  teamASquad?: string[];
  teamBSquad?: string[];
}

export interface Score {
  runs: number;
  wickets: number;
  overs: number; // Overs completed
  ballsThisOver: number; // Balls bowled in the current over
  battingTeamName: string;
  bowlingTeamName: string;
}

export interface BallEvent {
  runs: number; // 0-6
  isWicket: boolean;
  wicketType?: "Bowled" | "Caught" | "LBW" | "Run Out" | "Stumped" | "Hit Wicket" | "Other"; // Still useful for commentary
  extraType?: "Wide" | "NoBall" | "Byes" | "LegByes";
  extraRuns?: number;
  commentary?: string; // Auto-generated or manual
}

export interface Innings {
  teamName: string;
  score: number;
  wickets: number;
  overs: number;
  balls: number; // Total balls bowled in the innings
  timeline: BallEvent[];
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  startDate: string;
  endDate: string;
  teamNames: string[];
  matches?: Match[]; // Matches will also be simplified
  organizerName?: string; 
  logoUrl?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  profileType: "Scorer" | "Organizer" | "Fan"; // Removed "Player" as it's less distinct now
  achievements?: string[];
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
  battingTeamName: string | null;
  bowlingTeamName: string | null;
  target: number | null; // For 2nd innings
  matchDetails: Match | null; // Full match details
}

export interface MatchContextType extends MatchState {
  setMatchDetails: (match: Match) => void;
  startMatch: (matchId: string, tossWinnerName: string, electedTo: "Bat" | "Bowl", matchInfo: Match) => void;
  addBall: (event: BallEvent) => void;
  switchInnings: () => void;
  // other actions
}