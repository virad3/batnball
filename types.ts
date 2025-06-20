
import { FirebaseTimestamp } from './services/firebaseClient'; // Updated import

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

export enum DismissalType {
  NOT_OUT = "Not Out",
  BOWLED = "Bowled",
  CAUGHT = "Caught",
  LBW = "LBW",
  RUN_OUT = "Run Out",
  STUMPED = "Stumped",
  HIT_WICKET = "Hit Wicket",
  RETIRED_HURT = "Retired Hurt",
  TIMED_OUT = "Timed Out",
  HANDLED_BALL = "Handled Ball", // Historic, now Obstruction
  OBSTRUCTING_FIELD = "Obstructing Field",
  HIT_BALL_TWICE = "Hit Ball Twice", // Historic
  OTHER = "Other"
}

export interface PlayerBattingStats {
  playerId: string; // Corresponds to a name from the squad list
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  status: DismissalType;
  bowlerName?: string; // Bowler who took the wicket
  fielderName?: string; // Fielder involved in dismissal (catch, run out, stump)
  battingOrder?: number;
}

export interface PlayerBowlingStats {
  playerId: string; // Corresponds to a name from the squad list
  playerName: string;
  oversBowled: number; // Can be decimal, e.g., 3.5 for 3 overs and 5 balls
  ballsBowled: number; // Total balls bowled by this bowler
  maidens: number;
  runsConceded: number;
  wickets: number;
}

export interface InningsRecord {
  teamName: string;
  totalRuns: number;
  totalWickets: number;
  totalOversBowled: number; // Actual overs bowled, e.g., 19.5
  totalBallsBowled: number;
  battingPerformances: PlayerBattingStats[];
  bowlingPerformances: PlayerBowlingStats[];
  declared?: boolean;
  forfeited?: boolean;
  timeline?: BallEvent[]; // Optional: keep if detailed ball-by-ball is stored within innings JSON
}

export interface Match {
  id: string; // UUID from Supabase
  user_id?: string; // UUID of the user who created the match
  teamAName: string;
  teamBName: string;
  date: string | FirebaseTimestamp; // ISO string when in state/UI, Timestamp from Firestore
  venue: string;
  format: MatchFormat;
  status: "Upcoming" | "Live" | "Completed";
  tossWinnerName?: string;
  electedTo?: "Bat" | "Bowl";
  overs_per_innings?: number; // Max overs for limited over matches
  
  teamASquad?: string[];
  teamBSquad?: string[];
  
  result_summary?: string; // e.g., "Team A won by 5 wickets"
  tournament_id?: string | null; // Optional foreign key

  innings1Record?: InningsRecord | null;
  innings2Record?: InningsRecord | null;

  // Fields to track current state if not fully in context or for quick resume
  current_batting_team?: string;
  current_bowler_name?: string;
  current_striker_name?: string;
  current_non_striker_name?: string;
}

// Score is now more of a display concern derived from InningsRecord
export interface Score {
  runs: number;
  wickets: number;
  overs: number; 
  ballsThisOver: number;
  battingTeamName: string;
  bowlingTeamName: string;
}

export interface BallEvent {
  runs: number; 
  isWicket: boolean;
  wicketType?: DismissalType;
  batsmanOutName?: string;
  bowlerName?: string; // Bowler involved in the ball event
  fielderName?: string; // Fielder involved in wicket
  extraType?: "Wide" | "NoBall" | "Byes" | "LegByes";
  extraRuns?: number;
  commentary?: string;
  strikerName?: string; // Who faced the ball
}

export type TournamentStatus = "Upcoming" | "Ongoing" | "Past";

export interface Tournament {
  id: string;
  user_id?: string;
  name: string;
  format: TournamentFormat;
  startDate: string | FirebaseTimestamp;
  endDate: string | FirebaseTimestamp;
  teamNames: string[];
  matches?: Match[]; 
  organizerName?: string; 
  logoUrl?: string;
  location?: string; // Added location field
}

export interface UserProfile {
  id: string; // from auth.users.id
  username: string; // from user_metadata or profiles table
  email?: string; // from auth.users.email
  profileType: "Scorer" | "Organizer" | "Fan" | "Player"; // from user_metadata or profiles table
  profilePicUrl?: string | null; // from user_metadata or profiles table
  achievements?: string[]; // from user_metadata or profiles table (example)
  teamIds?: string[]; // New field to store IDs of teams the user is part of

  // New fields for 'profiles' table
  location?: string | null;
  date_of_birth?: string | null; // ISO date string YYYY-MM-DD
  mobile_number?: string | null;
  player_role?: "Batsman" | "Bowler" | "All-rounder" | "Wicketkeeper" | "" | null;
  batting_style?: "Right-hand bat" | "Left-hand bat" | "" | null;
  bowling_style?: string | null; // e.g., "Right-arm fast", "Left-arm orthodox"
}


export interface GeneratedCommentary {
  ballByBall: string;
  summary?: string;
}

// Match context types
export interface MatchState {
  matchDetails: Match | null; // Note: matchDetails.date will be string after conversion in context
  // Live scoring specific state that might not be directly part of Match object until persisted
  currentStrikerName: string | null;
  currentNonStrikerName: string | null;
  currentBowlerName: string | null;
  currentInningsNumber: 1 | 2;
  // Target is still useful for display
  target: number | null; 
}

export interface MatchContextType extends MatchState {
  setMatchDetails: (match: Match | null) => void;
  loadMatch: (matchId: string) => Promise<Match | null>;
  startNewMatch: (partialMatchData: Partial<Match>) => Promise<Match | null>;
  updateTossAndStartInnings: (tossWinner: string, elected: "Bat" | "Bowl") => Promise<void>;
  addBall: (event: BallEvent) => Promise<void>; // Make async for potential save
  switchInnings: () => Promise<void>; // Make async
  saveMatchState: () => Promise<void>; // Explicit save
  endMatch: (resultSummary: string) => Promise<void>;
  setPlayerRoles: (striker?: string, nonStriker?: string, bowler?: string) => void;
}

export interface Team {
  id: string;
  user_id: string;
  name: string;
  players: string[]; // Stores player names. Linking to UserProfile is done via name matching for now.
  createdAt: FirebaseTimestamp;
  logoUrl?: string | null;
}

export interface SearchResultItem {
  title: string;
  description: string;
  type: "Player" | "Team" | "Match" | "Tournament" | "Other" | string; // Allow string for flexibility from Gemini
}
