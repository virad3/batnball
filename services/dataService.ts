
import { Match, Tournament, UserProfile, MatchFormat, TournamentFormat } from '../types';
// Supabase client might be used here in the future to fetch extended profile data
// import { supabase } from './supabaseClient';


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
    matches: [mockMatches[0], mockMatches[2]] 
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

// This mock user profile is now less relevant for the Header, 
// as Header will use Supabase auth user.
// It might still be used if ProfilePage falls back or for testing createTournament organizer.
const mockStaticUserProfile: UserProfile = {
  id: 'user123_static_mock', // Different ID to distinguish
  username: 'StaticMockUser',
  email: 'static_user@example.com',
  profileType: 'Fan',
  profilePicUrl: 'https://picsum.photos/seed/staticmockuser/150/150',
  achievements: ["Static Achievement 1", "Static Achievement 2"],
};


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
      // In a real app, organizerName would come from the logged-in user's profile
      // For now, it could use a static mock or be undefined
      const newTournament: Tournament = {
        ...data,
        id: `tourney${Date.now()}`,
        matches: [], 
        organizerName: "Organiser (from Supabase user)", // Placeholder
      };
      mockTournaments.push(newTournament);
      resolve(JSON.parse(JSON.stringify(newTournament)));
    }, 500);
  });
};

// getCurrentUserProfile will need to be re-thought with Supabase.
// It should ideally fetch from a 'profiles' table using the authenticated user's ID.
// For now, this mock is a fallback and ProfilePage.tsx uses auth.user directly.
export const getCurrentUserProfile = (): Promise<UserProfile> => {
  console.warn("dataService.getCurrentUserProfile is using a static mock. Integrate with Supabase user for actual data.");
  // In a real scenario with Supabase:
  // const { data: { user } } = await supabase.auth.getUser();
  // if (user) {
  //   // Fetch from your 'profiles' table where id === user.id
  //   // const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  //   // if (profileData) return profileData as UserProfile;
  //   // Fallback to construct from auth.user if no 'profiles' table entry
  //   return simulateApiCall({
  //      id: user.id,
  //      username: user.user_metadata?.username || user.email,
  //      email: user.email,
  //      profileType: user.user_metadata?.profile_type || 'Fan',
  //      profilePicUrl: user.user_metadata?.profile_pic_url,
  //      achievements: user.user_metadata?.achievements || []
  //   });
  // }
  return simulateApiCall(mockStaticUserProfile); 
};


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

export const mockTeamNamesForSelection: string[] = [
    "Gladiators", "Ninjas", "Spartans", "Vikings", "Raptors", "Cobras"
];