
import { Match, Tournament, Player, Team, UserProfile, MatchFormat, TournamentFormat } from '../types';

// Mock Data
export const mockPlayers: Player[] = [
  { id: 'player1', name: 'Virat K.', role: 'Batsman', profilePicUrl: 'https://picsum.photos/seed/virat/100/100' },
  { id: 'player2', name: 'Jasprit B.', role: 'Bowler', profilePicUrl: 'https://picsum.photos/seed/jasprit/100/100' },
  { id: 'player3', name: 'Rohit S.', role: 'Batsman', profilePicUrl: 'https://picsum.photos/seed/rohit/100/100' },
  { id: 'player4', name: 'Ravindra J.', role: 'All-Rounder', profilePicUrl: 'https://picsum.photos/seed/jadeja/100/100' },
  { id: 'player5', name: 'Surya Y.', role: 'Batsman', profilePicUrl: 'https://picsum.photos/seed/surya/100/100' },
  { id: 'player6', name: 'Hardik P.', role: 'All-Rounder', profilePicUrl: 'https://picsum.photos/seed/hardik/100/100' },
];

export const mockTeams: Team[] = [
  { id: 'teamA', name: 'Royal Challengers', logoUrl: 'https://picsum.photos/seed/rcb/100/100', players: mockPlayers.slice(0,3) },
  { id: 'teamB', name: 'Mumbai Indians', logoUrl: 'https://picsum.photos/seed/mi/100/100', players: mockPlayers.slice(3,6) },
  { id: 'teamC', name: 'Chennai Kings', logoUrl: 'https://picsum.photos/seed/csk/100/100', players: [mockPlayers[0], mockPlayers[2], mockPlayers[4]] },
  { id: 'teamD', name: 'Delhi Capitals', logoUrl: 'https://picsum.photos/seed/dc/100/100', players: [mockPlayers[1], mockPlayers[3], mockPlayers[5]] },
];

let mockMatches: Match[] = [
  { 
    id: 'match1', 
    teamA: mockTeams[0], 
    teamB: mockTeams[1], 
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Chinnaswamy Stadium', 
    format: MatchFormat.T20, 
    status: 'Upcoming',
    overs: 20,
  },
  { 
    id: 'match2', 
    teamA: mockTeams[2], 
    teamB: mockTeams[3], 
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Wankhede Stadium', 
    format: MatchFormat.ODI, 
    status: 'Completed', 
    result: 'Chennai Kings won by 25 runs',
    overs: 50,
    currentScore: { runs: 280, wickets: 7, overs: 50, ballsThisOver:0, battingTeam: mockTeams[2], bowlingTeam: mockTeams[3] } // Simplified score
  },
  { 
    id: 'match3', 
    teamA: mockTeams[0], 
    teamB: mockTeams[3], 
    date: new Date().toISOString(), 
    venue: 'Eden Gardens', 
    format: MatchFormat.T20, 
    status: 'Live',
    overs: 20,
    tossWinner: mockTeams[0],
    electedTo: "Bat",
    currentScore: { runs: 85, wickets: 2, overs: 10, ballsThisOver: 3, battingTeam: mockTeams[0], bowlingTeam: mockTeams[3], currentStriker: mockPlayers[0], currentNonStriker: mockPlayers[1], currentBowler: mockPlayers[3] }
  },
   { 
    id: 'match4', 
    teamA: mockTeams[1], 
    teamB: mockTeams[2], 
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'MA Chidambaram', 
    format: MatchFormat.T20, 
    status: 'Upcoming',
    overs: 20,
  },
];

let mockTournaments: Tournament[] = [
  { 
    id: 'tourney1', 
    name: 'Summer T20 Bash', 
    format: TournamentFormat.LEAGUE, 
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
    teams: mockTeams.slice(0,4),
    logoUrl: 'https://picsum.photos/seed/summerbash/400/200',
    matches: [mockMatches[0], mockMatches[2]]
  },
  { 
    id: 'tourney2', 
    name: 'Weekend Knockout Challenge', 
    format: TournamentFormat.KNOCKOUT, 
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    teams: [mockTeams[0], mockTeams[1], mockTeams[2], mockTeams[3]],
    logoUrl: 'https://picsum.photos/seed/knockout/400/200',
  },
];

const mockUserProfile: UserProfile = {
  id: 'user123',
  username: 'CricketFanatic',
  email: 'fan@example.com',
  profileType: 'Fan',
  profilePicUrl: 'https://picsum.photos/seed/user123/150/150',
  achievements: ["MVP - Local League 2023", "Tournament Winner - Winter Cup"],
  followedPlayers: [mockPlayers[0], mockPlayers[2]],
  followedTeams: [mockTeams[1]]
};


// Simulate API calls
const simulateApiCall = <T,>(data: T, delay: number = 300): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), delay));
};

export const getAllMatches = (): Promise<Match[]> => simulateApiCall(mockMatches);
export const getUpcomingMatches = (limit: number = 3): Promise<Match[]> => 
  simulateApiCall(mockMatches.filter(m => m.status === 'Upcoming').slice(0, limit));
export const getMatchById = (id: string): Promise<Match | undefined> => 
  simulateApiCall(mockMatches.find(m => m.id === id));

export const getAllTournaments = (): Promise<Tournament[]> => simulateApiCall(mockTournaments);
export const getOngoingTournaments = (limit: number = 2): Promise<Tournament[]> =>
  simulateApiCall(mockTournaments.filter(t => new Date(t.endDate) > new Date() && new Date(t.startDate) < new Date()).slice(0, limit));
export const getTournamentById = (id: string): Promise<Tournament | undefined> =>
  simulateApiCall(mockTournaments.find(t => t.id === id));
export const getMatchesByTournamentId = (tournamentId: string): Promise<Match[]> => {
    const tournament = mockTournaments.find(t => t.id === tournamentId);
    if(tournament && tournament.matches) {
        return simulateApiCall(tournament.matches);
    }
    // Fallback: search all matches (less efficient, but covers cases where matches aren't embedded)
    return simulateApiCall(mockMatches.filter(m => 
        m.teamA.id && tournament?.teams.some(t => t.id === m.teamA.id) &&
        m.teamB.id && tournament?.teams.some(t => t.id === m.teamB.id)
    ));
}


export const createTournament = (data: Omit<Tournament, 'id' | 'matches' | 'organizer'>): Promise<Tournament> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newTournament: Tournament = {
        ...data,
        id: `tourney${Date.now()}`,
        matches: [], // Initially no matches
        organizer: mockUserProfile, // Assume current user is organizer
      };
      mockTournaments.push(newTournament);
      resolve(JSON.parse(JSON.stringify(newTournament)));
    }, 500);
  });
};


export const getCurrentUserProfile = (): Promise<UserProfile> => simulateApiCall(mockUserProfile);

// Potentially add functions for players, etc.
export const getAllPlayers = (): Promise<Player[]> => simulateApiCall(mockPlayers);
export const getPlayerById = (id: string): Promise<Player | undefined> => simulateApiCall(mockPlayers.find(p => p.id === id));

// Add a function to update match (used by scoring)
export const updateMatch = (updatedMatch: Match): Promise<Match> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockMatches.findIndex(m => m.id === updatedMatch.id);
      if (index !== -1) {
        mockMatches[index] = { ...mockMatches[index], ...updatedMatch };
        resolve(JSON.parse(JSON.stringify(mockMatches[index])));
      } else {
        reject(new Error("Match not found"));
      }
    }, 200);
  });
};
