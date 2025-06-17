
import { Match, Tournament, UserProfile } from '../types';
import { supabase } from './supabaseClient';
import { AuthError } from '@supabase/supabase-js';

// Helper to get current user ID
const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Matches
export const getAllMatches = async (): Promise<Match[]> => {
  const userId = await getUserId();
  if (!userId) return []; // Or throw error, depending on desired behavior for unauthenticated users

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
  const userId = await getUserId();
  if (!userId) return null; // Or ensure ID is enough if public viewing is allowed with different RLS

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    // .eq('user_id', userId) // Might be redundant if RLS handles this, or useful for strict check
    .single();
  if (error) {
    console.error('Error fetching match by ID:', error.message);
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

export const createMatch = async (matchData: Partial<Match>): Promise<Match> => {
  const userId = await getUserId();
  if (!userId) throw new Error("User must be logged in to create a match.");

  const matchToInsert = {
    ...matchData,
    user_id: userId,
    // Ensure default empty innings records if not provided
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
  // const userId = await getUserId(); // Potentially useful for RLS checks if not automatically handled
  // if (!userId) throw new Error("User must be logged in to update a match.");

  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    // .eq('user_id', userId) // Add if RLS needs client-side reinforcement
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
  // Assuming tournaments might be public or user-specific based on RLS
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


// This function is still primarily illustrative. Profile data should come from auth.user
// or a dedicated 'profiles' table linked to auth.users.id.
// The Header uses auth.user directly. ProfilePage can do the same.
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // This is a simplified profile based on auth data.
  // A real app would likely fetch from a 'profiles' table.
  return {
    id: user.id,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
    email: user.email,
    profileType: user.user_metadata?.profile_type || 'Fan',
    profilePicUrl: user.user_metadata?.profile_pic_url,
    achievements: user.user_metadata?.achievements || [],
  };
};

// mockTeamNamesForSelection is no longer needed as teams are entered per tournament
export const mockTeamNamesForSelection: string[] = [];
