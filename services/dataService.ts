import { Match, Tournament, UserProfile } from '../types';
import { db, auth, storage } from './firebaseClient';
import { 
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { User, updateProfile as updateFirebaseUserProfile } from 'firebase/auth';

// Helper to get current user ID
const getUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// --- Matches ---
export const getAllMatches = async (): Promise<Match[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const matchesCol = collection(db, 'matches');
  const q = query(matchesCol, where('user_id', '==', userId), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Match));
};

export const getUpcomingMatches = async (count: number = 3): Promise<Match[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const matchesCol = collection(db, 'matches');
  const q = query(
    matchesCol,
    where('user_id', '==', userId),
    where('status', '==', 'Upcoming'),
    orderBy('date', 'asc'),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Match));
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (id === 'newmatch') {
    console.log('[dataService] getMatchById: "newmatch" ID encountered, returning null.');
    return null;
  }
  const matchDocRef = doc(db, 'matches', id);
  const docSnap = await getDoc(matchDocRef);
  if (docSnap.exists()) {
    // Basic RLS check - ensure user owns this match
    const matchData = { id: docSnap.id, ...docSnap.data() } as Match;
    const currentUserId = getUserId();
    if (matchData.user_id === currentUserId) {
      return matchData;
    } else {
      console.warn(`[dataService] User ${currentUserId} attempted to access match ${id} owned by ${matchData.user_id}. Access denied.`);
      return null; // Or throw error
    }
  }
  console.log(`[dataService] Match with ID (${id}) not found in Firestore.`);
  return null;
};

export const createMatch = async (matchData: Partial<Match>): Promise<Match> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a match.");

  const matchToInsert = {
    ...matchData,
    user_id: userId,
    date: matchData.date ? Timestamp.fromDate(new Date(matchData.date)) : Timestamp.now(),
    innings1Record: matchData.innings1Record || null,
    innings2Record: matchData.innings2Record || null,
  };
  const matchesCol = collection(db, 'matches');
  const docRef = await addDoc(matchesCol, matchToInsert);
  return { id: docRef.id, ...matchToInsert } as Match; // Return with ID
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<Match> => {
  const matchDocRef = doc(db, 'matches', matchId);
  // Convert date string back to Timestamp if present in updates
  if (updates.date && typeof updates.date === 'string') {
    updates.date = Timestamp.fromDate(new Date(updates.date)) as any; // Firestore expects Timestamp
  }
  await updateDoc(matchDocRef, updates);
  const updatedDocSnap = await getDoc(matchDocRef);
  if (!updatedDocSnap.exists()) throw new Error("Match not found after update.");
  return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Match;
};

// --- Tournaments ---
export const getAllTournaments = async (): Promise<Tournament[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const tournamentsCol = collection(db, 'tournaments');
  const q = query(tournamentsCol, where('user_id', '==', userId), orderBy('startDate', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament));
};

export const getOngoingTournaments = async (count: number = 2): Promise<Tournament[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const tournamentsCol = collection(db, 'tournaments');
  const currentDate = Timestamp.now();
  const q = query(
    tournamentsCol,
    where('user_id', '==', userId),
    where('startDate', '<=', currentDate), 
    // Firestore doesn't support range filters on different fields. 
    // This needs to be filtered client-side or by restructuring data (e.g. an 'isOngoing' flag updated by a function).
    // For now, we'll fetch based on start date and filter end date client-side.
    orderBy('startDate', 'asc') 
    // limit(count) // Apply limit after client-side filtering
  );
  const querySnapshot = await getDocs(q);
  const ongoing = querySnapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament))
    .filter(t => t.endDate && Timestamp.fromDate(new Date(t.endDate)) >= currentDate)
    .slice(0, count);
  return ongoing;
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const tournamentDocRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(tournamentDocRef);
  if (docSnap.exists()) {
    const tournamentData = { id: docSnap.id, ...docSnap.data() } as Tournament;
    const currentUserId = getUserId();
     if (tournamentData.user_id === currentUserId) {
      return tournamentData;
    } else {
      console.warn(`[dataService] User ${currentUserId} attempted to access tournament ${id} owned by ${tournamentData.user_id}. Access denied.`);
      return null;
    }
  }
  return null;
};

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'matches' | 'user_id'>): Promise<Tournament> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a tournament.");

  const currentUser = auth.currentUser;
  const organizerName = currentUser?.displayName || currentUser?.email || "Unknown Organizer";

  const tournamentToInsert = {
    ...tournamentData,
    user_id: userId,
    organizerName: organizerName,
    startDate: tournamentData.startDate ? Timestamp.fromDate(new Date(tournamentData.startDate)) : Timestamp.now(),
    endDate: tournamentData.endDate ? Timestamp.fromDate(new Date(tournamentData.endDate)) : Timestamp.now(),
  };

  const tournamentsCol = collection(db, 'tournaments');
  const docRef = await addDoc(tournamentsCol, tournamentToInsert);
  return { id: docRef.id, ...tournamentToInsert } as Tournament;
};

// --- User Profile Functions ---

// Fetches combined profile from Firebase Auth and Firestore "profiles" collection
export const getFullUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    console.warn("Attempted to fetch profile for a different or non-authenticated user.");
    return null;
  }

  const profileDocRef = doc(db, 'profiles', userId);
  const profileDocSnap = await getDoc(profileDocRef);

  let dbProfileData: Partial<UserProfile> = {};
  if (profileDocSnap.exists()) {
    dbProfileData = profileDocSnap.data() as Partial<UserProfile>;
  }

  return {
    id: currentUser.uid,
    email: currentUser.email || '',
    username: currentUser.displayName || dbProfileData.username || currentUser.email?.split('@')[0] || 'User',
    profileType: dbProfileData.profileType || 'Fan', // Default to Fan if not set
    profilePicUrl: currentUser.photoURL || dbProfileData.profilePicUrl,
    achievements: dbProfileData.achievements || [], // Assuming achievements are only in Firestore

    location: dbProfileData.location ?? null,
    date_of_birth: dbProfileData.date_of_birth ? (dbProfileData.date_of_birth as any instanceof Timestamp ? (dbProfileData.date_of_birth as any).toDate().toISOString().split('T')[0] : dbProfileData.date_of_birth) : null,
    mobile_number: dbProfileData.mobile_number ?? null,
    player_role: dbProfileData.player_role ?? null,
    batting_style: dbProfileData.batting_style ?? null,
    bowling_style: dbProfileData.bowling_style ?? null,
  };
};

export const updateUserProfile = async (
  userId: string,
  profileUpdates: Partial<UserProfile>
): Promise<{ user: User | null, profile: UserProfile | null, error?: any }> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return { user: currentUser, profile: null, error: new Error("User mismatch or not authenticated.") };
  }

  const authProfileUpdates: { displayName?: string, photoURL?: string } = {};
  if (profileUpdates.username !== undefined) authProfileUpdates.displayName = profileUpdates.username;
  if (profileUpdates.profilePicUrl !== undefined) authProfileUpdates.photoURL = profileUpdates.profilePicUrl;

  try {
    // Update Firebase Auth profile if there are changes
    if (Object.keys(authProfileUpdates).length > 0) {
      await updateFirebaseUserProfile(currentUser, authProfileUpdates);
    }

    // Prepare updates for Firestore "profiles" collection
    // Exclude fields managed by Firebase Auth or not directly updatable here
    const { id, email, achievements, ...firestoreProfileUpdates } = profileUpdates;
    
    if (firestoreProfileUpdates.date_of_birth && typeof firestoreProfileUpdates.date_of_birth === 'string') {
        firestoreProfileUpdates.date_of_birth = Timestamp.fromDate(new Date(firestoreProfileUpdates.date_of_birth)) as any;
    }


    if (Object.keys(firestoreProfileUpdates).length > 0) {
      const profileDocRef = doc(db, 'profiles', userId);
      await setDoc(profileDocRef, firestoreProfileUpdates, { merge: true });
    }
    
    // Refetch the potentially updated auth user (displayName, photoURL might have changed)
    // and the full profile from Firestore.
    await auth.currentUser?.reload(); // Ensure current user reflects auth changes
    const updatedFullProfile = await getFullUserProfile(userId);
    return { user: auth.currentUser, profile: updatedFullProfile, error: null };

  } catch (e: any) {
    console.error("Error updating profile in dataService:", e);
    return { user: auth.currentUser, profile: null, error: e };
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;
  const storageRef = ref(storage, filePath);

  try {
    await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading profile picture to Firebase Storage:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const userId = getUserId();
  if (!userId) return null;
  return getFullUserProfile(userId);
};

// Remove Supabase-specific client export if it existed
// export { supabase }; // This line would be removed if it was for Supabase client
