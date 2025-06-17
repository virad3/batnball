
import { Match, Tournament, UserProfile, MatchFormat, TournamentFormat } from '../types';
// Supabase client might be used here in the future to fetch extended profile data
// import { supabase } from './supabaseClient';


let mockMatches: Match[] = [];

let mockTournaments: Tournament[] = [];

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
        // This logic might be less relevant now with empty mockMatches
        // but kept for structure if matches were dynamically associated
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
        // If it's a new match (e.g., id starts with temp-), add it
        if (updatedMatch.id.startsWith("temp-")) {
            const newMatchForSave = {...updatedMatch, id: `match${Date.now()}`}; // Give it a permanent-like ID
            mockMatches.push(newMatchForSave);
            resolve(JSON.parse(JSON.stringify(newMatchForSave)));
        } else {
            // If actual persistence is implemented, this would be an error.
            // For mock, we can choose to add it or reject.
            // Given the user wants to clear data, new matches will build up here.
            const newMatchForSave = {...updatedMatch, id: updatedMatch.id || `match${Date.now()}`};
            mockMatches.push(newMatchForSave);
            resolve(JSON.parse(JSON.stringify(newMatchForSave)));
            // reject(new Error("Match not found for update, and was not a new temporary match."));
        }
      }
    }, 200);
  });
};

export const mockTeamNamesForSelection: string[] = [];
