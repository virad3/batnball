import { Match, Tournament, UserProfile, Team } from '../types';
import { db, auth, storage } from './firebaseClient';
import { 
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, writeBatch, DocumentData, collectionGroup,getCountFromServer, arrayUnion, arrayRemove 
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
    // For public viewing of matches eventually, this check might be relaxed or user_id might not be the sole check.
    // For now, only owner can load full match details for context.
    if (matchData.user_id === currentUserId) {
      return matchData;
    } else {
      console.warn(`[dataService] User ${currentUserId} attempted to access match ${id} owned by ${matchData.user_id}. Access denied for full context load.`);
      // Allow fetching basic data if needed for public viewing, but for full scoring context, ownership is key.
      // For now, return null if not owner, as this is used by MatchContext mostly.
      return null; 
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
    date: matchData.date ? Timestamp.fromDate(new Date(matchData.date as string)) : Timestamp.now(),
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
    // For now, allow any authenticated user to view tournament details for simplicity.
    // RLS can be tightened later if needed.
    // const currentUserId = getUserId();
    //  if (tournamentData.user_id === currentUserId) { 
    return tournamentData;
    // } else {
    //   console.warn(`[dataService] User ${currentUserId} attempted to access tournament ${id} owned by ${tournamentData.user_id}. Access denied.`);
    //   return null;
    // }
  }
  return null;
};

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'matches' | 'user_id'>): Promise<Tournament> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a tournament.");

  const currentUser = auth.currentUser;
  const organizerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Unknown Organizer";

  const tournamentToInsert = {
    ...tournamentData, // Includes name, format, location, teamNames, logoUrl
    user_id: userId,
    organizerName: organizerName,
    startDate: tournamentData.startDate ? Timestamp.fromDate(new Date(tournamentData.startDate as string)) : Timestamp.now(),
    endDate: tournamentData.endDate ? Timestamp.fromDate(new Date(tournamentData.endDate as string)) : Timestamp.now(),
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
    // Allow any authenticated user to view team details for now.
    // RLS can be tightened later.
    // const currentUserId = getUserId();
    // if (teamData.user_id === currentUserId) { 
    return teamData;
    // } else {
    //   console.warn(`[dataService] User ${currentUserId} attempted to access team ${id} owned by ${teamData.user_id}. Access denied.`);
    //   return null;
    // }
  }
  return null;
};

export const updateTeam = async (teamId: string, updates: Partial<Omit<Team, 'id' | 'user_id' | 'createdAt'>>): Promise<Team> => {
  const teamDocRef = doc(db, 'teams', teamId);
  const teamData = await getTeamById(teamId); // Fetch to check ownership before update
  const currentUserId = getUserId();
  if (!teamData || teamData.user_id !== currentUserId) {
    throw new Error("Team not found or user does not have permission to update.");
  }
  
  // Ensure user_id and createdAt are not part of updates from client
  const { user_id, createdAt, ...validUpdates } = updates as any; 
  await updateDoc(teamDocRef, validUpdates);
  const updatedDocSnap = await getDoc(teamDocRef);
  if (!updatedDocSnap.exists()) throw new Error("Team not found after update.");
  return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Team;
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  const teamToDelete = await getTeamById(teamId); 
  const currentUserId = getUserId();
  if (!teamToDelete || teamToDelete.user_id !== currentUserId) {
    throw new Error("Team not found or user does not have permission to delete.");
  }
  // TODO: Future enhancement: Remove this teamId from all UserProfile.teamIds
  const teamDocRef = doc(db, 'teams', teamId);
  await deleteDoc(teamDocRef);
};


// --- User Profile Functions ---

// Fetches combined profile from Firebase Auth and Firestore "profiles" collection for a given userId
export const getFullUserProfile = async (targetUserId: string): Promise<UserProfile | null> => {
  const profileDocRef = doc(db, 'profiles', targetUserId);
  const profileDocSnap = await getDoc(profileDocRef);

  if (!profileDocSnap.exists()) {
    console.warn(`[dataService:getFullUserProfile] Profile for user ID ${targetUserId} not found in Firestore.`);
    return null; 
  }
  
  const firestoreRawData: DocumentData = profileDocSnap.data();
  console.log(`[dataService:getFullUserProfile] Raw data for ${targetUserId} from Firestore:`, firestoreRawData);
  console.log(`[dataService:getFullUserProfile] Raw teamIds for ${targetUserId} from Firestore:`, firestoreRawData.teamIds);

  const dbProfileData: Partial<UserProfile> = firestoreRawData as Partial<UserProfile>;

  let dobString: string | null = null;
  const rawDobFromFirestore = firestoreRawData?.date_of_birth;

  if (rawDobFromFirestore instanceof Timestamp) {
    dobString = rawDobFromFirestore.toDate().toISOString().split('T')[0];
  } else if (typeof rawDobFromFirestore === 'string' && rawDobFromFirestore) {
     try {
        dobString = new Date(rawDobFromFirestore).toISOString().split('T')[0];
     } catch (e) {
        dobString = rawDobFromFirestore; 
     }
  }


  return {
    id: targetUserId,
    email: dbProfileData.email || '', 
    username: dbProfileData.username || 'User',
    profileType: dbProfileData.profileType || 'Fan',
    profilePicUrl: dbProfileData.profilePicUrl || null,
    achievements: dbProfileData.achievements || [],
    teamIds: dbProfileData.teamIds || [], // Initialize teamIds
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

    if (authProfileUpdates.displayName) {
        firestoreProfileUpdates.username = authProfileUpdates.displayName;
    }
    if (authProfileUpdates.photoURL !== undefined) {
        firestoreProfileUpdates.profilePicUrl = authProfileUpdates.photoURL;
    }
    firestoreProfileUpdates.email = currentUser.email;


    if (firestoreProfileUpdates.date_of_birth) { 
        try {
            firestoreProfileUpdates.date_of_birth = Timestamp.fromDate(new Date(firestoreProfileUpdates.date_of_birth as string)) as any;
        } catch (e) {
            console.warn("Invalid date_of_birth string, not converting to Timestamp:", firestoreProfileUpdates.date_of_birth);
        }
    } else if (firestoreProfileUpdates.date_of_birth === '' || firestoreProfileUpdates.date_of_birth === null) {
      (firestoreProfileUpdates as any).date_of_birth = null;
    }


    if (Object.keys(firestoreProfileUpdates).length > 0) {
      const profileDocRef = doc(db, 'profiles', userId);
      const finalUpdatesForFirestore: any = {};
      for (const key in firestoreProfileUpdates) {
          if (Object.prototype.hasOwnProperty.call(firestoreProfileUpdates, key)) {
              const typedKey = key as keyof Partial<UserProfile>;
              if (profileUpdates.hasOwnProperty(typedKey)) {
                finalUpdatesForFirestore[typedKey] = firestoreProfileUpdates[typedKey];
              } else if (typedKey === 'email' || typedKey === 'username' || typedKey === 'profilePicUrl') {
                 finalUpdatesForFirestore[typedKey] = firestoreProfileUpdates[typedKey];
              }
          }
      }
      if(Object.keys(finalUpdatesForFirestore).length > 0) {
        await setDoc(profileDocRef, finalUpdatesForFirestore, { merge: true });
      }
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
  try {
    const querySnapshot = await getDocs(profilesCol);
    
    if (querySnapshot.empty) {
      console.warn("[dataService] No documents found in 'profiles' collection when fetching for suggestions. Ensure the collection exists, has data, and security rules allow reads.");
      return [];
    }
    
    const profiles: Pick<UserProfile, 'id' | 'username'>[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const username = (typeof data.username === 'string' && data.username.trim() !== '') ? data.username.trim() : 'Unnamed User';
      profiles.push({
        id: docSnap.id,
        username: username
      });
    });
    
    // console.log(`[dataService] Fetched ${profiles.length} profiles for suggestions:`, profiles); // Reduced verbosity
    return profiles;

  } catch (error) {
    console.error("[dataService] Error fetching user profiles for suggestions:", error);
    return []; 
  }
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
  if (currentUserId === targetUserId) return false; 

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

// --- Team Affiliation for User Profiles ---
export const addUserToTeamAffiliation = async (userId: string, teamId: string): Promise<void> => {
  const profileDocRef = doc(db, 'profiles', userId);
  try {
    await updateDoc(profileDocRef, {
      teamIds: arrayUnion(teamId)
    });
    console.log(`[dataService:addUserToTeamAffiliation] Team ${teamId} successfully added to profile ${userId}`);
  } catch (error: any) {
    console.error(`[dataService:addUserToTeamAffiliation] Failed to add team ${teamId} to profile ${userId}. Error Code: ${error.code || 'N/A'}, Message: ${error.message || 'Unknown error'}`, error);
  }
};

export const removeUserFromTeamAffiliation = async (userId: string, teamId: string): Promise<void> => {
  const profileDocRef = doc(db, 'profiles', userId);
  try {
    await updateDoc(profileDocRef, {
      teamIds: arrayRemove(teamId)
    });
    console.log(`[dataService:removeUserFromTeamAffiliation] Team ${teamId} successfully removed from profile ${userId}`);
  } catch (error: any) {
    console.error(`[dataService:removeUserFromTeamAffiliation] Failed to remove team ${teamId} from profile ${userId}. Error Code: ${error.code || 'N/A'}, Message: ${error.message || 'Unknown error'}`, error);
  }
};

export const getTeamsInfoByIds = async (teamIds: string[]): Promise<Array<Pick<Team, 'id' | 'name'>>> => {
  console.log(`[dataService:getTeamsInfoByIds] Received teamIds to fetch:`, teamIds);
  if (!teamIds || teamIds.length === 0) {
    console.warn("[dataService:getTeamsInfoByIds] Received empty or null teamIds array. Returning empty.");
    return [];
  }
  const teamsCol = collection(db, 'teams');
  
  if (teamIds.length > 30) {
    console.warn("[dataService:getTeamsInfoByIds] Fetching more than 30 teams by ID at once. Consider batching for performance/limits.");
  }
  
  const q = query(teamsCol, where('__name__', 'in', teamIds)); 
  const querySnapshot = await getDocs(q);
  
  const fetchedTeams = querySnapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return { 
      id: docSnap.id, 
      name: data.name || 'Unnamed Team' 
    } as Pick<Team, 'id' | 'name'>;
  });
  console.log(`[dataService:getTeamsInfoByIds] Fetched teams data:`, fetchedTeams);
  return fetchedTeams;
};