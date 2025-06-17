
import { Match, Tournament, UserProfile, MatchFormat, TournamentFormat } from '../types';

// Mock Data Removed: mockPlayers, mockTeams

let mockMatches: Match[] = [
  { 
    id: 'match1', 
    teamAName: 'Titans CC', 
    teamBName: 'Warriors XI', 
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'City Ground', 
    format: MatchFormat.T20, 
    status: 'Upcoming',
    overs: 20,
  },
  { 
    id: 'match2', 
    teamAName: 'Kings Club', 
    teamBName: 'United Strikers', 
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'North Park', 
    format: MatchFormat.ODI, 
    status: 'Completed', 
    result: 'Kings Club won by 25 runs',
    overs: 50,
    currentScore: { runs: 280, wickets: 7, overs: 50, ballsThisOver:0, battingTeamName: 'Kings Club', bowlingTeamName: 'United Strikers' }
  },
  { 
    id: 'match3', 
    teamAName: 'Titans CC', 
    teamBName: 'United Strikers', 
    date: new Date().toISOString(), 
    venue: 'South Stadium', 
    format: MatchFormat.T20, 
    status: 'Live',
    overs: 20,
    tossWinnerName: 'Titans CC',
    electedTo: "Bat",
    currentScore: { runs: 85, wickets: 2, overs: 10, ballsThisOver: 3, battingTeamName: 'Titans CC', bowlingTeamName: 'United Strikers' }
  },
   { 
    id: 'match4', 
    teamAName: 'Warriors XI', 
    teamBName: 'Kings Club', 
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'East Arena', 
    format: MatchFormat.T20, 
    status: 'Upcoming',
    overs: 20,
  },
];

let mockTournaments: Tournament[] = [
  { 
    id: 'tourney1', 
    name: 'City T20 Championship', 
    format: TournamentFormat.LEAGUE, 
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
    teamNames: ['Titans CC', 'Warriors XI', 'Kings Club', 'United Strikers'],
    logoUrl: 'https://picsum.photos/seed/citychamp/400/200',
    matches: [mockMatches[0], mockMatches[2]] // Simplified matches
  },
  { 
    id: 'tourney2', 
    name: 'Weekend Cup', 
    format: TournamentFormat.KNOCKOUT, 
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    teamNames: ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'],
    logoUrl: 'https://picsum.photos/seed/weekendcup/400/200',
  },
];

const mockUserProfile: UserProfile = {
  id: 'user123',
  username: 'CricketFanUser',
  email: 'user@example.com',
  profileType: 'Fan',
  profilePicUrl: 'https://picsum.photos/seed/user123profile/150/150',
  achievements: ["Dedicated Fan Award 2023", "Top Supporter"],
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
    // Fallback: This logic might need adjustment based on how matches are associated post-simplification
    // For now, if a tournament has teamNames, we can filter matches that include those names.
    // This is a simplified approach.
    if (tournament) {
        return simulateApiCall(mockMatches.filter(m => 
            tournament.teamNames.includes(m.teamAName) || tournament.teamNames.includes(m.teamBName)
        ));
    }
    return simulateApiCall([]);
}


export const createTournament = (data: Omit<Tournament, 'id' | 'matches' | 'organizerName'>): Promise<Tournament> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newTournament: Tournament = {
        ...data,
        id: `tourney${Date.now()}`,
        matches: [], // Initially no matches
        organizerName: mockUserProfile.username, // Assume current user is organizer
      };
      mockTournaments.push(newTournament);
      resolve(JSON.parse(JSON.stringify(newTournament)));
    }, 500);
  });
};


export const getCurrentUserProfile = (): Promise<UserProfile> => simulateApiCall(mockUserProfile);

// Player specific functions removed: getAllPlayers, getPlayerById

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

// Mock teams for selection in CreateTournamentPage (simplified to just names)
export const mockTeamNamesForSelection: string[] = [
    "Gladiators", "Ninjas", "Spartans", "Vikings", "Raptors", "Cobras"
];
