
import { Match, Tournament, UserProfile, Team } from '../types';
import { db, auth, storage } from './firebaseClient';
import { 
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, writeBatch, DocumentData, collectionGroup,getCountFromServer 
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
    orderBy('startDate', 'asc') 
  );
  const querySnapshot = await getDocs(q);
  const ongoing = querySnapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament))
    .filter(t => t.endDate && Timestamp.fromDate(new Date(t.endDate as string)) >= currentDate) // Ensure string for Date constructor
    .slice(0, count);
  return ongoing;
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const tournamentDocRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(tournamentDocRef);
  if (docSnap.exists()) {
    const tournamentData = { id: docSnap.id, ...docSnap.data() } as Tournament;
    const currentUserId = getUserId();
     if (tournamentData.user_id === currentUserId) { // Only owner can view details for now
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
    startDate: tournamentData.startDate ? Timestamp.fromDate(new Date(tournamentData.startDate as string)) : Timestamp.now(), // Ensure string for Date constructor
    endDate: tournamentData.endDate ? Timestamp.fromDate(new Date(tournamentData.endDate as string)) : Timestamp.now(), // Ensure string for Date constructor
  };

  const tournamentsCol = collection(db, 'tournaments');
  const docRef = await addDoc(tournamentsCol, tournamentToInsert);
  return { id: docRef.id, ...tournamentToInsert } as Tournament;
};

// --- Teams ---
export const createTeam = async (teamData: Pick<Team, 'name' | 'players' | 'logoUrl'>): Promise<Team> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a team.");

  const teamToInsert = {
    ...teamData,
    user_id: userId,
    createdAt: Timestamp.now(),
  };
  const teamsCol = collection(db, 'teams');
  const docRef = await addDoc(teamsCol, teamToInsert);
  return { id: docRef.id, ...teamToInsert } as Team;
};

export const getTeamsByUserId = async (): Promise<Team[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const teamsCol = collection(db, 'teams');
  const q = query(teamsCol, where('user_id', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team));
};

export const getTeamById = async (id: string): Promise<Team | null> => {
  const teamDocRef = doc(db, 'teams', id);
  const docSnap = await getDoc(teamDocRef);
  if (docSnap.exists()) {
    const teamData = { id: docSnap.id, ...docSnap.data() } as Team;
    const currentUserId = getUserId();
    if (teamData.user_id === currentUserId) { // Only owner can view team details for now
      return teamData;
    } else {
      console.warn(`[dataService] User ${currentUserId} attempted to access team ${id} owned by ${teamData.user_id}. Access denied.`);
      return null;
    }
  }
  return null;
};

export const updateTeam = async (teamId: string, updates: Partial<Omit<Team, 'id' | 'user_id' | 'createdAt'>>): Promise<Team> => {
  const teamDocRef = doc(db, 'teams', teamId);
  // Ensure user_id and createdAt are not part of updates from client
  const { user_id, createdAt, ...validUpdates } = updates as any; 
  await updateDoc(teamDocRef, validUpdates);
  const updatedDocSnap = await getDoc(teamDocRef);
  if (!updatedDocSnap.exists()) throw new Error("Team not found after update.");
  return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Team;
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  const teamToDelete = await getTeamById(teamId); // Verifies ownership for now
  if (!teamToDelete) {
    throw new Error("Team not found or user does not have permission to delete.");
  }
  const teamDocRef = doc(db, 'teams', teamId);
  await deleteDoc(teamDocRef);
};


// --- User Profile Functions ---

// Fetches combined profile from Firebase Auth and Firestore "profiles" collection for a given userId
export const getFullUserProfile = async (targetUserId: string): Promise<UserProfile | null> => {
  const profileDocRef = doc(db, 'profiles', targetUserId);
  const profileDocSnap = await getDoc(profileDocRef);

  if (!profileDocSnap.exists()) {
    console.warn(`Profile for user ID ${targetUserId} not found in Firestore.`);
    // Attempt to create a basic profile if user exists in Auth but not Firestore (e.g., edge case)
    // This is less common now with onAuthStateChanged handling.
    return null; 
  }
  
  const firestoreRawData: DocumentData = profileDocSnap.data();
  const dbProfileData: Partial<UserProfile> = firestoreRawData as Partial<UserProfile>;

  let dobString: string | null = null;
  const rawDobFromFirestore = firestoreRawData?.date_of_birth;

  if (rawDobFromFirestore instanceof Timestamp) {
    dobString = rawDobFromFirestore.toDate().toISOString().split('T')[0];
  } else if (typeof rawDobFromFirestore === 'string') {
    dobString = rawDobFromFirestore;
  }

  return {
    id: targetUserId,
    email: dbProfileData.email || '', 
    username: dbProfileData.username || 'User',
    profileType: dbProfileData.profileType || 'Fan',
    profilePicUrl: dbProfileData.profilePicUrl || null,
    achievements: dbProfileData.achievements || [],
    location: dbProfileData.location ?? null,
    date_of_birth: dobString,
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
    return { user: currentUser, profile: null, error: new Error("User mismatch or not authenticated for profile update.") };
  }

  const authProfileUpdates: { displayName?: string, photoURL?: string | null } = {};
  if (profileUpdates.username !== undefined && profileUpdates.username !== currentUser.displayName) {
     authProfileUpdates.displayName = profileUpdates.username;
  }
  if (profileUpdates.profilePicUrl !== undefined && profileUpdates.profilePicUrl !== currentUser.photoURL) {
     authProfileUpdates.photoURL = profileUpdates.profilePicUrl;
  }

  try {
    if (Object.keys(authProfileUpdates).length > 0) {
      await updateFirebaseUserProfile(currentUser, authProfileUpdates);
    }

    const { id, email, achievements, ...firestoreProfileUpdatesInput } = profileUpdates;
    const firestoreProfileUpdates: Partial<UserProfile> = { ...firestoreProfileUpdatesInput };

    if (authProfileUpdates.displayName || authProfileUpdates.photoURL) {
        firestoreProfileUpdates.email = currentUser.email; 
        firestoreProfileUpdates.username = authProfileUpdates.displayName || currentUser.displayName || undefined;
        firestoreProfileUpdates.profilePicUrl = authProfileUpdates.photoURL === undefined ? currentUser.photoURL : authProfileUpdates.photoURL;
    }

    if (firestoreProfileUpdates.date_of_birth && typeof firestoreProfileUpdates.date_of_birth === 'string') {
        firestoreProfileUpdates.date_of_birth = Timestamp.fromDate(new Date(firestoreProfileUpdates.date_of_birth)) as any;
    } else if (firestoreProfileUpdates.date_of_birth === null || firestoreProfileUpdates.date_of_birth === '') {
        firestoreProfileUpdates.date_of_birth = null;
    }

    if (Object.keys(firestoreProfileUpdates).length > 0) {
      const profileDocRef = doc(db, 'profiles', userId);
      const finalUpdatesForFirestore: any = {};
      for (const key in firestoreProfileUpdates) {
          if (Object.prototype.hasOwnProperty.call(firestoreProfileUpdates, key)) {
              const typedKey = key as keyof Partial<UserProfile>;
              if (firestoreProfileUpdates[typedKey] !== undefined) { 
                  finalUpdatesForFirestore[typedKey] = firestoreProfileUpdates[typedKey];
              }
          }
      }
      await setDoc(profileDocRef, finalUpdatesForFirestore, { merge: true });
    }
    
    await auth.currentUser?.reload(); 
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

// --- Player Suggestions ---
export const getAllUserProfilesForSuggestions = async (): Promise<Pick<UserProfile, 'id' | 'username'>[]> => {
  const profilesCol = collection(db, 'profiles');
  // Consider adding orderBy('username') if you want suggestions to be alphabetically sorted by default
  // Add limit if the number of users is very large and you want to implement server-side search instead
  const q = query(profilesCol); 
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      username: data.username || 'Unnamed User' // Fallback for safety
    } as Pick<UserProfile, 'id' | 'username'>;
  });
};


// --- Follow System ---
const followsCollection = collection(db, 'follows');

export const followUser = async (targetUserIdToFollow: string): Promise<void> => {
  const currentUserId = getUserId();
  if (!currentUserId) throw new Error("User must be logged in to follow.");
  if (currentUserId === targetUserIdToFollow) throw new Error("Cannot follow yourself.");

  const followData = {
    followerId: currentUserId,
    followingId: targetUserIdToFollow,
    followedAt: Timestamp.now(),
  };
  // Use a composite ID for the document to easily check existence and prevent duplicates
  // This also makes unfollowing easier if we know both IDs.
  const followDocId = `${currentUserId}_${targetUserIdToFollow}`;
  const followDocRef = doc(followsCollection, followDocId);
  
  await setDoc(followDocRef, followData);
};

export const unfollowUser = async (targetUserIdToUnfollow: string): Promise<void> => {
  const currentUserId = getUserId();
  if (!currentUserId) throw new Error("User must be logged in to unfollow.");

  const followDocId = `${currentUserId}_${targetUserIdToUnfollow}`;
  const followDocRef = doc(followsCollection, followDocId);
  
  await deleteDoc(followDocRef);
};

export const checkIfFollowing = async (targetUserId: string): Promise<boolean> => {
  const currentUserId = getUserId();
  if (!currentUserId) return false;
  if (currentUserId === targetUserId) return false; // Cannot follow self

  const followDocId = `${currentUserId}_${targetUserId}`;
  const followDocRef = doc(followsCollection, followDocId);
  const docSnap = await getDoc(followDocRef);
  return docSnap.exists();
};

export const getFollowersCount = async (targetUserId: string): Promise<number> => {
  const q = query(followsCollection, where('followingId', '==', targetUserId));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

export const getFollowingCount = async (targetUserId: string): Promise<number> => {
  const q = query(followsCollection, where('followerId', '==', targetUserId));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};
