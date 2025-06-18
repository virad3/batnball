
import { Match, Tournament, UserProfile } from '../types';
import { supabase } from './supabaseClient';
import { AuthError, User }  from '@supabase/supabase-js';

// Helper to get current user ID
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Matches
export const getAllMatches = async (): Promise<Match[]> => {
  const userId = await getUserId();
  if (!userId) return []; 

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
  return data || [];
};

export const getUpcomingMatches = async (limit: number = 3): Promise<Match[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'Upcoming')
    .order('date', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('Error fetching upcoming matches:', error);
    throw error;
  }
  return data || [];
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (id === 'newmatch') {
    console.log('[dataService] getMatchById: "newmatch" ID encountered, returning null without DB query.');
    return null; // "newmatch" is a client-side signal, not a valid DB ID.
  }

  // RLS will handle if the user has access to this specific match ID.
  // No explicit userId check needed here for fetching a specific ID if RLS is properly configured.
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`[dataService] Error fetching match by ID (${id}):`, error.message);
    if (error.code === 'PGRST116') { // Standard "Not found"
      console.log(`[dataService] Match with ID (${id}) not found in DB.`);
      return null;
    }
    throw error; // Other unexpected errors
  }
  console.log(`[dataService] Successfully fetched match with ID (${id}):`, data);
  return data;
};

export const createMatch = async (matchData: Partial<Match>): Promise<Match> => {
  const userId = await getUserId();
  if (!userId) throw new Error("User must be logged in to create a match.");

  const matchToInsert = {
    ...matchData,
    user_id: userId,
    innings1Record: matchData.innings1Record || null,
    innings2Record: matchData.innings2Record || null,
  };

  const { data, error } = await supabase
    .from('matches')
    .insert(matchToInsert)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating match:', error);
    throw error;
  }
  if (!data) throw new Error("Match creation did not return data.");
  return data;
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<Match> => {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating match:', error);
    throw error;
  }
  if (!data) throw new Error("Match update did not return data.");
  return data;
};


// Tournaments
export const getAllTournaments = async (): Promise<Tournament[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('user_id', userId)
    .order('startDate', { ascending: false });
  if (error) {
    console.error('Error fetching tournaments:', error);
    throw error;
  }
  return data || [];
};

export const getOngoingTournaments = async (limit: number = 2): Promise<Tournament[]> => {
    const userId = await getUserId();
    if (!userId) return [];
    
    const currentDate = new Date().toISOString();
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', userId)
        .lt('startDate', currentDate)
        .gt('endDate', currentDate)
        .order('startDate', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching ongoing tournaments:', error);
        throw error;
    }
    return data || [];
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching tournament by ID:', error);
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'matches' | 'organizerName' | 'user_id'>): Promise<Tournament> => {
  const userId = await getUserId();
  if (!userId) throw new Error("User must be logged in to create a tournament.");

  const user = (await supabase.auth.getUser()).data.user;
  const organizerName = user?.user_metadata?.username || user?.email || "Unknown Organizer";

  const tournamentToInsert = {
    ...tournamentData,
    user_id: userId,
    organizerName: organizerName,
  };

  const { data, error } = await supabase
    .from('tournaments')
    .insert(tournamentToInsert)
    .select()
    .single();
  if (error) {
    console.error('Error creating tournament:', error);
    throw error;
  }
  if (!data) throw new Error("Tournament creation did not return data.");
  return data;
};

// --- User Profile Functions ---

export const getFullUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data: { user: authUser } } = await supabase.auth.getUser(); 
  if (!authUser || authUser.id !== userId) {
    console.warn("Attempted to fetch profile for a different or non-authenticated user.");
    return null;
  }

  let profileDataFromTable: Partial<UserProfile> = {};
  const { data: dbProfile, error: dbError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (dbError && dbError.code !== 'PGRST116') { 
    console.error('Error fetching profile from DB:', dbError);
  }
  if (dbProfile) {
    profileDataFromTable = dbProfile;
  }
  
  const combinedProfile: UserProfile = {
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username || profileDataFromTable?.username || authUser.email?.split('@')[0] || 'User',
    profileType: authUser.user_metadata?.profile_type || profileDataFromTable?.profileType || 'Fan',
    profilePicUrl: authUser.user_metadata?.profile_pic_url || profileDataFromTable?.profilePicUrl,
    achievements: authUser.user_metadata?.achievements || [], 

    location: profileDataFromTable?.location ?? null,
    date_of_birth: profileDataFromTable?.date_of_birth ?? null,
    mobile_number: profileDataFromTable?.mobile_number ?? null,
    player_role: profileDataFromTable?.player_role ?? null,
    batting_style: profileDataFromTable?.batting_style ?? null,
    bowling_style: profileDataFromTable?.bowling_style ?? null,
  };
  return combinedProfile;
};

export const updateUserProfile = async (
  userId: string,
  profileUpdates: Partial<UserProfile>
): Promise<{ user: User | null, profile: UserProfile | null, error?: any }> => {
  let authMetaDataUpdates: Record<string, any> = {};
  let profilesTableSpecificUpdates: Omit<Partial<UserProfile>, 'id' | 'email' | 'achievements' | 'username' | 'profilePicUrl' | 'profileType'> = {};
  let profilesTableSharedUpdates: Partial<Pick<UserProfile, 'username' | 'profilePicUrl' | 'profileType'>> = {};


  if (profileUpdates.username !== undefined) {
    authMetaDataUpdates.username = profileUpdates.username;
    profilesTableSharedUpdates.username = profileUpdates.username;
  }
  if (profileUpdates.profilePicUrl !== undefined) { 
    authMetaDataUpdates.profile_pic_url = profileUpdates.profilePicUrl;
    profilesTableSharedUpdates.profilePicUrl = profileUpdates.profilePicUrl;
  }
  if (profileUpdates.profileType !== undefined) {
    authMetaDataUpdates.profile_type = profileUpdates.profileType;
    profilesTableSharedUpdates.profileType = profileUpdates.profileType;
  }

  if (profileUpdates.location !== undefined) profilesTableSpecificUpdates.location = profileUpdates.location;
  if (profileUpdates.date_of_birth !== undefined) profilesTableSpecificUpdates.date_of_birth = profileUpdates.date_of_birth;
  if (profileUpdates.mobile_number !== undefined) profilesTableSpecificUpdates.mobile_number = profileUpdates.mobile_number;
  if (profileUpdates.player_role !== undefined) profilesTableSpecificUpdates.player_role = profileUpdates.player_role;
  if (profileUpdates.batting_style !== undefined) profilesTableSpecificUpdates.batting_style = profileUpdates.batting_style;
  if (profileUpdates.bowling_style !== undefined) profilesTableSpecificUpdates.bowling_style = profileUpdates.bowling_style;
  
  let authUserToReturn: User | null = null;
  const { data: { user: initialAuthUser } } = await supabase.auth.getUser();
  authUserToReturn = initialAuthUser;

  if (Object.keys(authMetaDataUpdates).length > 0) {
    const { data, error: authError } = await supabase.auth.updateUser({ data: authMetaDataUpdates });
    if (authError) return { user: authUserToReturn, profile: null, error: authError };
    authUserToReturn = data.user; 
  }

  const allProfilesTableUpdates = { ...profilesTableSpecificUpdates, ...profilesTableSharedUpdates };

  if (Object.keys(allProfilesTableUpdates).length > 0) {
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ ...allProfilesTableUpdates, user_id: userId }, { onConflict: 'user_id' })
      .select() 
      .single();

    if (dbError) return { user: authUserToReturn, profile: null, error: dbError };
  }
  
  const updatedFullProfile = await getFullUserProfile(userId);
  return { user: authUserToReturn, profile: updatedFullProfile, error: null };
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`; 
  const filePath = `avatars/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600', 
      upsert: true 
    });

  if (uploadError) {
    console.error('Error uploading profile picture:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  if (!data || !data.publicUrl) {
    console.error('Could not get public URL for uploaded image.');
    return null; 
  }
  return data.publicUrl;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  return getFullUserProfile(userId);
};

export const mockTeamNamesForSelection: string[] = [];
    