

import { Match, Tournament, UserProfile, Team } from '../types';
import { db, auth, storage, Timestamp, FieldValue, firebase } from './firebaseClient';
import type { FirebaseDocumentData, FirebaseQuery, FirebaseCollectionReference, FirebaseDocumentReference, FirebaseQuerySnapshot, FirebaseDocumentSnapshot } from './firebaseClient';
import type { User } from 'firebase/auth';
import { updateProfile as updateFirebaseUserProfile } from 'firebase/auth';

// Helper to get current user ID
const getUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

// --- Matches ---
export const getAllMatches = async (): Promise<Match[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const matchesCol = db.collection('matches') as FirebaseCollectionReference;
  // Default sort by date descending to show recent matches first in a general list
  const q = matchesCol.where('user_id', '==', userId).orderBy('date', 'desc');
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Match));
};

export const getRecentMatches = async (count: number = 3): Promise<Match[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const matchesCol = db.collection('matches') as FirebaseCollectionReference;
  // Fetches most recent "Live" or "Completed" matches based on date.
  const q = matchesCol
    .where('user_id', '==', userId)
    .where('status', 'in', ['Live', 'Completed']) // Only Live or Completed
    .orderBy('date', 'desc')
    .limit(count);
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Match));
};


export const getUpcomingMatches = async (count: number = 5): Promise<Match[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const matchesCol = db.collection('matches') as FirebaseCollectionReference;
  const q = matchesCol
    .where('user_id', '==', userId)
    .where('date', '>', Timestamp.now()) // Query for dates in the future
    .orderBy('date', 'asc') // Show the soonest upcoming matches first
    .limit(count);
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Match));
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (id === 'newmatch') {
    console.log('[dataService] getMatchById: "newmatch" ID encountered, returning null.');
    return null;
  }
  const matchDocRef = db.collection('matches').doc(id) as FirebaseDocumentReference;
  const docSnap = await matchDocRef.get() as FirebaseDocumentSnapshot;
  if (docSnap.exists) {
    const matchData = { id: docSnap.id, ...docSnap.data() } as Match;
    return matchData;
  }
  console.log(`[dataService] Match with ID (${id}) not found in Firestore.`);
  return null;
};

export const createMatch = async (matchData: Partial<Match>): Promise<Match> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a match.");

  let matchDateTimestamp: firebase.firestore.Timestamp;
  if (matchData.date) {
    if (typeof matchData.date === 'string') {
      matchDateTimestamp = Timestamp.fromDate(new Date(matchData.date));
    } else if (matchData.date instanceof Timestamp) {
      matchDateTimestamp = matchData.date;
    } else {
      // Fallback or error if date format is unexpected
      console.warn("Unexpected date format for match, defaulting to now:", matchData.date);
      matchDateTimestamp = Timestamp.now();
    }
  } else {
    matchDateTimestamp = Timestamp.now();
  }
  
  const matchToInsert = {
    ...matchData,
    user_id: userId,
    date: matchDateTimestamp, // Ensure it's a Firestore Timestamp
    status: matchData.status || "Upcoming", // Default to Upcoming if not specified
    innings1Record: matchData.innings1Record || null,
    innings2Record: matchData.innings2Record || null,
  };
  const matchesCol = db.collection('matches') as FirebaseCollectionReference;
  const docRef = await matchesCol.add(matchToInsert);
  return { id: docRef.id, ...matchToInsert } as Match;
};

export const updateMatch = async (matchId: string, updates: Partial<Match>): Promise<Match> => {
  const matchDocRef = db.collection('matches').doc(matchId) as FirebaseDocumentReference;
  
  const updateData: Record<string, any> = { ...updates }; // Create a mutable copy

  if (updateData.date && typeof updateData.date === 'string') {
    updateData.date = Timestamp.fromDate(new Date(updateData.date));
  }
  await matchDocRef.update(updateData);
  const updatedDocSnap = await matchDocRef.get() as FirebaseDocumentSnapshot;
  if (!updatedDocSnap.exists) throw new Error("Match not found after update.");
  return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Match;
};

export const deleteMatchFirebase = async (matchId: string): Promise<void> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to delete a match.");

  const matchDocRef = db.collection('matches').doc(matchId) as FirebaseDocumentReference;
  const matchSnap = await matchDocRef.get() as FirebaseDocumentSnapshot;

  if (!matchSnap.exists) {
    throw new Error("Match not found, cannot delete.");
  }
  
  const matchData = matchSnap.data() as Match;
  if (matchData.user_id !== userId) {
    throw new Error("User does not have permission to delete this match.");
  }

  await matchDocRef.delete();
};


// --- Tournaments ---
export const getAllTournaments = async (): Promise<Tournament[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const tournamentsCol = db.collection('tournaments') as FirebaseCollectionReference;
  const q = tournamentsCol.where('user_id', '==', userId).orderBy('startDate', 'desc');
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament));
};

export const getOngoingTournaments = async (count: number = 2): Promise<Tournament[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const tournamentsCol = db.collection('tournaments') as FirebaseCollectionReference;
  const currentDate = Timestamp.now();
  const q = tournamentsCol
    .where('user_id', '==', userId)
    .where('startDate', '<=', currentDate) 
    .orderBy('startDate', 'asc');
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  const ongoing = querySnapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament))
    .filter(t => t.endDate && (t.endDate instanceof Timestamp ? t.endDate : Timestamp.fromDate(new Date(t.endDate as string))) >= currentDate)
    .slice(0, count);
  return ongoing;
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const tournamentDocRef = db.collection('tournaments').doc(id) as FirebaseDocumentReference;
  const docSnap = await tournamentDocRef.get() as FirebaseDocumentSnapshot;
  if (docSnap.exists) {
    const tournamentData = { id: docSnap.id, ...docSnap.data() } as Tournament;
    return tournamentData;
  }
  return null;
};

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'matches' | 'user_id'>): Promise<Tournament> => {
  const userId = getUserId();
  if (!userId) throw new Error("User must be logged in to create a tournament.");

  const currentUser = auth.currentUser;
  const organizerName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Unknown Organizer";

  const tournamentToInsert = {
    ...tournamentData,
    user_id: userId,
    organizerName: organizerName,
    startDate: tournamentData.startDate ? Timestamp.fromDate(new Date(tournamentData.startDate as string)) : Timestamp.now(),
    endDate: tournamentData.endDate ? Timestamp.fromDate(new Date(tournamentData.endDate as string)) : Timestamp.now(),
  };

  const tournamentsCol = db.collection('tournaments') as FirebaseCollectionReference;
  const docRef = await tournamentsCol.add(tournamentToInsert);
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
  const teamsCol = db.collection('teams') as FirebaseCollectionReference;
  const docRef = await teamsCol.add(teamToInsert);
  return { id: docRef.id, ...teamToInsert } as Team;
};

export const getTeamsByUserId = async (): Promise<Team[]> => {
  const userId = getUserId();
  if (!userId) return [];

  const teamsCol = db.collection('teams') as FirebaseCollectionReference;
  const q = teamsCol.where('user_id', '==', userId).orderBy('createdAt', 'desc');
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team));
};

export const getTeamById = async (id: string): Promise<Team | null> => {
  const teamDocRef = db.collection('teams').doc(id) as FirebaseDocumentReference;
  const docSnap = await teamDocRef.get() as FirebaseDocumentSnapshot;
  if (docSnap.exists) {
    const teamData = { id: docSnap.id, ...docSnap.data() } as Team;
    return teamData;
  }
  return null;
};

export const updateTeam = async (teamId: string, updates: Partial<Omit<Team, 'id' | 'user_id' | 'createdAt'>>): Promise<Team> => {
  const teamDocRef = db.collection('teams').doc(teamId) as FirebaseDocumentReference;
  const teamData = await getTeamById(teamId);
  const currentUserId = getUserId();
  if (!teamData || teamData.user_id !== currentUserId) {
    throw new Error("Team not found or user does not have permission to update.");
  }
  
  const { user_id, createdAt, ...validUpdates } = updates as any; 
  await teamDocRef.update(validUpdates);
  const updatedDocSnap = await teamDocRef.get() as FirebaseDocumentSnapshot;
  if (!updatedDocSnap.exists) throw new Error("Team not found after update.");
  return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Team;
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  const teamToDelete = await getTeamById(teamId); 
  const currentUserId = getUserId();
  if (!teamToDelete || teamToDelete.user_id !== currentUserId) {
    throw new Error("Team not found or user does not have permission to delete.");
  }
  const teamDocRef = db.collection('teams').doc(teamId) as FirebaseDocumentReference;
  await teamDocRef.delete();
};


// --- User Profile Functions ---
export const getFullUserProfile = async (targetUserId: string): Promise<UserProfile | null> => {
  const profileDocRef = db.collection('profiles').doc(targetUserId) as FirebaseDocumentReference;
  const profileDocSnap = await profileDocRef.get() as FirebaseDocumentSnapshot;

  if (!profileDocSnap.exists) {
    console.warn(`[dataService:getFullUserProfile] Profile for user ID ${targetUserId} not found in Firestore.`);
    return null; 
  }
  
  const firestoreRawData: FirebaseDocumentData | undefined = profileDocSnap.data();
  if (!firestoreRawData) return null; // Should not happen if exists is true

  const dbProfileData: Partial<UserProfile> = firestoreRawData as Partial<UserProfile>;

  let dobString: string | null = null;
  const rawDobFromFirestore = firestoreRawData?.date_of_birth;

  if (rawDobFromFirestore instanceof Timestamp) {
    dobString = rawDobFromFirestore.toDate().toISOString().split('T')[0];
  } else if (typeof rawDobFromFirestore === 'string' && rawDobFromFirestore) {
     try {
        const dateObj = new Date(rawDobFromFirestore);
        if (!isNaN(dateObj.getTime())) {
            dobString = dateObj.toISOString().split('T')[0];
        } else {
            dobString = null; // Invalid date string
        }
     } catch (e) {
        dobString = null; // Error parsing date string
     }
  }

  return {
    id: targetUserId,
    email: dbProfileData.email || '', 
    username: dbProfileData.username || 'User',
    profileType: dbProfileData.profileType || 'Fan',
    profilePicUrl: dbProfileData.profilePicUrl || null,
    achievements: dbProfileData.achievements || [],
    teamIds: Array.isArray(dbProfileData.teamIds) ? dbProfileData.teamIds : [],
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

    const { id, email, achievements, teamIds, date_of_birth: dobInput, ...otherProfileData } = profileUpdates;
    
    const finalDataForFirestore: Record<string, any> = { ...otherProfileData };

    if (authProfileUpdates.displayName) {
        finalDataForFirestore.username = authProfileUpdates.displayName;
    }
    if (profileUpdates.profilePicUrl === undefined && authProfileUpdates.photoURL !== undefined) {
        finalDataForFirestore.profilePicUrl = authProfileUpdates.photoURL;
    }
    
    if (profileUpdates.hasOwnProperty('date_of_birth')) {
        let dobValueForFirestore: firebase.firestore.Timestamp | null = null;
        if (dobInput && typeof dobInput === 'string') {
            try {
                const dateObj = new Date(dobInput);
                if (!isNaN(dateObj.getTime())) {
                    dobValueForFirestore = Timestamp.fromDate(dateObj);
                }
            } catch (e) {
                console.warn("Error parsing date_of_birth string for Firestore:", dobInput, e);
            }
        } else if (dobInput === null || dobInput === '') {
             dobValueForFirestore = null;
        }
        finalDataForFirestore.date_of_birth = dobValueForFirestore;
    }
    
    const cleanFinalDataForFirestore: Record<string, any> = {};
    for (const key in finalDataForFirestore) {
        if (Object.prototype.hasOwnProperty.call(finalDataForFirestore, key) && finalDataForFirestore[key] !== undefined) {
            cleanFinalDataForFirestore[key] = finalDataForFirestore[key];
        }
    }

    if (Object.keys(cleanFinalDataForFirestore).length > 0) {
      const profileDocRef = db.collection('profiles').doc(userId) as FirebaseDocumentReference;
      await profileDocRef.set(cleanFinalDataForFirestore, { merge: true });
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
  const storageRef = storage.ref(filePath);

  try {
    const uploadTaskSnapshot = await storageRef.put(file, { contentType: file.type });
    const downloadUrl = await uploadTaskSnapshot.ref.getDownloadURL();
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
  const profilesCol = db.collection('profiles') as FirebaseCollectionReference;
  try {
    const querySnapshot = await profilesCol.get() as FirebaseQuerySnapshot;
    
    if (querySnapshot.empty) {
      console.warn("[dataService] No documents found in 'profiles' collection when fetching for suggestions.");
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
    return profiles;

  } catch (error) {
    console.error("[dataService] Error fetching user profiles for suggestions:", error);
    return []; 
  }
};

// --- Follow System ---
const followsCollection = db.collection('follows') as FirebaseCollectionReference;

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
  const followDocRef = followsCollection.doc(followDocId);
  
  await followDocRef.set(followData);
};

export const unfollowUser = async (targetUserIdToUnfollow: string): Promise<void> => {
  const currentUserId = getUserId();
  if (!currentUserId) throw new Error("User must be logged in to unfollow.");

  const followDocId = `${currentUserId}_${targetUserIdToUnfollow}`;
  const followDocRef = followsCollection.doc(followDocId);
  
  await followDocRef.delete();
};

export const checkIfFollowing = async (targetUserId: string): Promise<boolean> => {
  const currentUserId = getUserId();
  if (!currentUserId) return false;
  if (currentUserId === targetUserId) return false; 

  const followDocId = `${currentUserId}_${targetUserId}`;
  const followDocRef = followsCollection.doc(followDocId);
  const docSnap = await followDocRef.get();
  return docSnap.exists;
};

// Replaced getCountFromServer with fetching docs and getting size
export const getFollowersCount = async (targetUserId: string): Promise<number> => {
  const q = followsCollection.where('followingId', '==', targetUserId);
  const snapshot = await q.get() as FirebaseQuerySnapshot;
  return snapshot.size;
};

export const getFollowingCount = async (targetUserId: string): Promise<number> => {
  const q = followsCollection.where('followerId', '==', targetUserId);
  const snapshot = await q.get() as FirebaseQuerySnapshot;
  return snapshot.size;
};

// --- Team Affiliation for User Profiles ---
export const addUserToTeamAffiliation = async (userId: string, teamId: string): Promise<void> => {
  const profileDocRef = db.collection('profiles').doc(userId) as FirebaseDocumentReference;
  try {
    await profileDocRef.update({
      teamIds: FieldValue.arrayUnion(teamId)
    });
    console.log(`[dataService:addUserToTeamAffiliation] Team ${teamId} successfully added to profile ${userId}`);
  } catch (error: any) {
    console.error(`[dataService:addUserToTeamAffiliation] Failed to add team ${teamId} to profile ${userId}. Error Code: ${error.code || 'N/A'}, Message: ${error.message || 'Unknown error'}`, error);
  }
};

export const removeUserFromTeamAffiliation = async (userId: string, teamId: string): Promise<void> => {
  const profileDocRef = db.collection('profiles').doc(userId) as FirebaseDocumentReference;
  try {
    await profileDocRef.update({
      teamIds: FieldValue.arrayRemove(teamId)
    });
    console.log(`[dataService:removeUserFromTeamAffiliation] Team ${teamId} successfully removed from profile ${userId}`);
  } catch (error: any) {
    console.error(`[dataService:removeUserFromTeamAffiliation] Failed to remove team ${teamId} from profile ${userId}. Error Code: ${error.code || 'N/A'}, Message: ${error.message || 'Unknown error'}`, error);
  }
};

export const getTeamsInfoByIds = async (teamIds: string[]): Promise<Array<Pick<Team, 'id' | 'name'>>> => {
  if (!teamIds || teamIds.length === 0) {
    return [];
  }
  const teamsCol = db.collection('teams') as FirebaseCollectionReference;
  
  const teamIdChunks: string[][] = [];
  for (let i = 0; i < teamIds.length; i += 10) { // Firestore 'in' query supports up to 10 elements in v8
    teamIdChunks.push(teamIds.slice(i, i + 10));
  }

  const fetchedTeams: Array<Pick<Team, 'id' | 'name'>> = [];
  for (const chunk of teamIdChunks) {
    if (chunk.length === 0) continue;
    const q = teamsCol.where(firebase.firestore.FieldPath.documentId(), 'in', chunk); 
    const querySnapshot = await q.get() as FirebaseQuerySnapshot;
    querySnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if(data) {
        fetchedTeams.push({ 
          id: docSnap.id, 
          name: data.name || 'Unnamed Team' 
        } as Pick<Team, 'id' | 'name'>);
      }
    });
  }
  return fetchedTeams;
};

// --- Internal Search Functions ---
export const searchPlayersByName = async (searchTerm: string, limitNum: number = 5): Promise<UserProfile[]> => {
    const profilesCol = db.collection('profiles') as FirebaseCollectionReference;
    const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

    const q = profilesCol
        .orderBy("username")
        .where("username", ">=", searchTermCapitalized) 
        .where("username", "<=", searchTermCapitalized + '\uf8ff')
        .limit(limitNum);
    const querySnapshot = await q.get() as FirebaseQuerySnapshot;
    const results = querySnapshot.docs.map(docSnap => getFullUserProfile(docSnap.id));
    return (await Promise.all(results)).filter(p => p !== null) as UserProfile[];
};

export const searchMatchesByTerm = async (searchTerm: string, limitNum: number = 3): Promise<Match[]> => {
  if (!searchTerm.trim()) return [];
  const matchesCol = db.collection('matches') as FirebaseCollectionReference;
  const resultsMap = new Map<string, Match>();

  const processQuery = async (field: keyof Match) => {
    const q = matchesCol 
        .orderBy(field as string)
        .where(field as string, ">=", searchTerm) 
        .where(field as string, "<=", searchTerm + '\uf8ff')
        .limit(limitNum);
    const snapshot = await q.get() as FirebaseQuerySnapshot;
    snapshot.forEach(docSnap => {
      if (!resultsMap.has(docSnap.id)) {
         const data = docSnap.data();
         if(data) resultsMap.set(docSnap.id, { id: docSnap.id, ...data } as Match);
      }
    });
  };

  await processQuery('teamAName');
  await processQuery('teamBName');
  await processQuery('venue');
  
  return Array.from(resultsMap.values()).slice(0, limitNum * 2);
};

export const searchTournamentsByName = async (searchTerm: string, limitNum: number = 5): Promise<Tournament[]> => {
   const tournamentsCol = db.collection('tournaments') as FirebaseCollectionReference;
    const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

    const q = tournamentsCol 
        .orderBy("name")
        .where("name", ">=", searchTermCapitalized) 
        .where("name", "<=", searchTermCapitalized + '\uf8ff')
        .limit(limitNum);
    const querySnapshot = await q.get() as FirebaseQuerySnapshot;
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Tournament));
};

export const searchTeamsByName = async (searchTerm: string, limitNum: number = 5): Promise<Team[]> => {
  const teamsCol = db.collection('teams') as FirebaseCollectionReference;
  const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

  const q = teamsCol
      .orderBy("name")
      .where("name", ">=", searchTermCapitalized)
      .where("name", "<=", searchTermCapitalized + '\uf8ff')
      .limit(limitNum);
  const querySnapshot = await q.get() as FirebaseQuerySnapshot;
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team));
};