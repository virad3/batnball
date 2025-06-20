
import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, Team } from '../types';
import {
    getFullUserProfile,
    updateUserProfile,
    uploadProfilePicture,
    checkIfFollowing,
    followUser,
    unfollowUser,
    getFollowersCount,
    getFollowingCount,
    getTeamsInfoByIds
} from '../services/dataService';
import { ArrowLeftIcon, UserPlusIcon, UserMinusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
  const { userId: paramsUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: authUserHook, loading: authLoadingHook } = useAuth(); 

  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [initialProfileData, setInitialProfileData] = useState<Partial<UserProfile>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  const [isFollowingCurrentUser, setIsFollowingCurrentUser] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followActionLoading, setFollowActionLoading] = useState(false);

  const [affiliatedTeams, setAffiliatedTeams] = useState<Array<Pick<Team, 'id' | 'name'>>>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);


  const loadProfileAndRelatedData = useCallback(async () => {
    console.log('[ProfilePage:loadProfileAndRelatedData] Starting to load profile data.');
    setPageLoading(true);
    setError(null);
    setAffiliatedTeams([]); 

    const effectiveUserId = paramsUserId || authUserHook?.uid;
    console.log(`[ProfilePage:loadProfileAndRelatedData] Effective User ID: ${effectiveUserId}, paramsUserId: ${paramsUserId}, authUserHook?.uid: ${authUserHook?.uid}`);
    setViewedUserId(effectiveUserId || null);

    if (!effectiveUserId) {
      if (!authLoadingHook) { 
        setError("User profile not found or user not authenticated.");
        console.log('[ProfilePage:loadProfileAndRelatedData] No effectiveUserId and auth not loading. Setting error.');
      } else {
        console.log('[ProfilePage:loadProfileAndRelatedData] No effectiveUserId, but auth is still loading.');
      }
      setPageLoading(false);
      return;
    }
    
    if (authUserHook?.uid) {
        setIsOwnProfile(effectiveUserId === authUserHook.uid);
        console.log(`[ProfilePage:loadProfileAndRelatedData] Is own profile? ${effectiveUserId === authUserHook.uid}`);
    } else {
        setIsOwnProfile(false); 
        console.log('[ProfilePage:loadProfileAndRelatedData] No authUser, cannot be own profile.');
    }
    
    let fetchedProfile: Partial<UserProfile> | null = null;
    try {
      console.log(`[ProfilePage:loadProfileAndRelatedData] Fetching full user profile for: ${effectiveUserId}`);
      fetchedProfile = await getFullUserProfile(effectiveUserId); 
      console.log(`[ProfilePage:loadProfileAndRelatedData] Fetched profile for ${effectiveUserId}:`, fetchedProfile);
    } catch (err: any) {
      setError(err.message || `Failed to load profile data for user ID ${effectiveUserId}.`);
      console.error("[ProfilePage:loadProfileAndRelatedData] Error loading profile:", err);
      setPageLoading(false);
      return;
    }

    if (fetchedProfile) {
      console.log(`[ProfilePage:loadProfileAndRelatedData] Setting profileData and initialProfileData with teamIds:`, fetchedProfile.teamIds);
      setProfileData(fetchedProfile);
      setInitialProfileData(fetchedProfile); 
      setProfilePicPreview(fetchedProfile.profilePicUrl || null);

      if (authUserHook?.uid && authUserHook.uid !== effectiveUserId) { 
        try {
            const isFollowing = await checkIfFollowing(effectiveUserId);
            setIsFollowingCurrentUser(isFollowing);
        } catch (followError: any) {
            console.error("[ProfilePage:loadProfileAndRelatedData] Error fetching follow status:", followError);
        }
      } else {
        setIsFollowingCurrentUser(false); 
      }
      try {
        const [followers, following] = await Promise.all([
            getFollowersCount(effectiveUserId),
            getFollowingCount(effectiveUserId)
        ]);
        setFollowersCount(followers);
        setFollowingCount(following);
      } catch (followCountError: any) {
        console.error("[ProfilePage:loadProfileAndRelatedData] Error fetching follow counts:", followCountError);
      }

      console.log(`[ProfilePage:loadProfileAndRelatedData] Checking teamIds on fetchedProfile:`, fetchedProfile.teamIds);
      if (fetchedProfile.teamIds && fetchedProfile.teamIds.length > 0) {
          console.log(`[ProfilePage:loadProfileAndRelatedData] Profile has teamIds: ${fetchedProfile.teamIds}. Fetching team info.`);
          setTeamsLoading(true);
          try {
              const teams = await getTeamsInfoByIds(fetchedProfile.teamIds);
              console.log(`[ProfilePage:loadProfileAndRelatedData] Fetched affiliated teams info:`, teams);
              setAffiliatedTeams(teams);
          } catch (teamsError: any) {
              console.error("[ProfilePage:loadProfileAndRelatedData] Error fetching affiliated teams:", teamsError);
              setAffiliatedTeams([]); 
          } finally {
              setTeamsLoading(false);
          }
      } else {
          console.log(`[ProfilePage:loadProfileAndRelatedData] Profile has no teamIds or teamIds array is empty.`);
          setAffiliatedTeams([]); 
      }

    } else {
      setError(`Profile for user ID ${effectiveUserId} not found.`);
      console.log(`[ProfilePage:loadProfileAndRelatedData] Fetched profile was null for ${effectiveUserId}.`);
      setAffiliatedTeams([]); 
    }
    setPageLoading(false);
    console.log('[ProfilePage:loadProfileAndRelatedData] Finished loading profile data.');
  }, [paramsUserId, authUserHook, authLoadingHook]); 


  useEffect(() => {
    console.log(`[ProfilePage:useEffect] Auth loading state: ${authLoadingHook}. Triggering loadProfileAndRelatedData if not loading.`);
    if (!authLoadingHook) { 
        loadProfileAndRelatedData();
    }
  }, [authLoadingHook, loadProfileAndRelatedData]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!isOwnProfile) return;
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile || !authUserHook?.uid) {
      setError("Not authorized to update this profile or user not authenticated.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let updatedPicUrl = profileData.profilePicUrl;
      if (profilePicFile) {
        const uploadedUrl = await uploadProfilePicture(authUserHook.uid, profilePicFile);
        if (uploadedUrl) {
          updatedPicUrl = uploadedUrl;
        } else {
          throw new Error("Profile picture upload failed to return a URL.");
        }
      }

      const updatesToSave: Partial<UserProfile> = {};
      (Object.keys(profileData) as Array<keyof UserProfile>).forEach(<K extends keyof UserProfile>(key: K) => {
        if (key === 'date_of_birth') {
            const initialDbDate = initialProfileData.date_of_birth; 
            const currentFormDate = profileData.date_of_birth; 
            const normalizedCurrentFormDate = currentFormDate === '' ? null : currentFormDate;
            if (normalizedCurrentFormDate !== initialDbDate) {
                 updatesToSave.date_of_birth = normalizedCurrentFormDate;
            }
        } else if (profileData[key] !== initialProfileData[key]) {
          updatesToSave[key] = profileData[key];
        }
      });

      if (updatedPicUrl !== initialProfileData.profilePicUrl || (profilePicFile && updatedPicUrl)) {
         updatesToSave.profilePicUrl = updatedPicUrl;
      }

      if (updatesToSave.hasOwnProperty('teamIds')) {
        delete updatesToSave.teamIds;
      }


      if (Object.keys(updatesToSave).length > 0) {
        const { profile: newProfileData, error: updateError } = await updateUserProfile(authUserHook.uid, updatesToSave);
        if (updateError) throw updateError;

        if (newProfileData) {
          setProfileData(newProfileData);
          setInitialProfileData(newProfileData);
          if (newProfileData.profilePicUrl) setProfilePicPreview(newProfileData.profilePicUrl);
          if (newProfileData.teamIds && newProfileData.teamIds.length > 0) {
              setTeamsLoading(true);
              getTeamsInfoByIds(newProfileData.teamIds).then(setAffiliatedTeams).finally(() => setTeamsLoading(false));
          } else {
              setAffiliatedTeams([]);
          }
        }
        setProfilePicFile(null);
        setSuccessMessage("Profile updated successfully!");
      } else {
        setSuccessMessage("No changes to save.");
      }

    } catch (err: any) {
      console.error("Detailed error updating profile:", err);
      let errorMessage = "Failed to update profile. Please check console for details.";
      if (err.message) errorMessage = `Failed to update profile: ${err.message}`;
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!authUserHook || !viewedUserId || isOwnProfile || followActionLoading) return;
    setFollowActionLoading(true);
    setError(null);
    try {
      if (isFollowingCurrentUser) {
        await unfollowUser(viewedUserId);
        setIsFollowingCurrentUser(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await followUser(viewedUserId);
        setIsFollowingCurrentUser(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update follow status.");
      console.error("Follow/unfollow error:", err);
    } finally {
      setFollowActionLoading(false);
    }
  };

  if (pageLoading || authLoadingHook) return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>;

  if (error && !profileData.id && !pageLoading) {
    return (
        <div className="text-center p-8 text-xl text-red-400 max-w-2xl mx-auto">
            <p>{error}</p>
            <Button onClick={() => navigate('/home')} className="mt-4" variant="outline">Go to Home</Button>
        </div>
    );
  }

  if (!viewedUserId && !authLoadingHook && !pageLoading) {
    return (
        <div className="text-center p-8 text-xl text-gray-300 max-w-2xl mx-auto">
            <p>Please log in to view your profile.</p>
            <Button onClick={() => navigate('/login')} className="mt-4" variant="primary">Login</Button>
        </div>
    );
  }
  if (!profileData.id && !pageLoading) { 
     return (
        <div className="text-center p-8 text-xl text-gray-300 max-w-2xl mx-auto">
            <p>Could not load profile data for the requested user.</p>
             <Button onClick={() => navigate(-1)} leftIcon={<ArrowLeftIcon className="w-5 h-5"/>} className="mt-4" variant="outline"> 
                Go Back
            </Button>
        </div>
    );
  }

  const inputClass = "block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-gray-100 placeholder-gray-400 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"; // Updated focus
  const labelClass = "block text-sm font-medium text-gray-300";
  const readOnlyValueClass = "mt-1 text-sm text-gray-200 py-2";

  const renderField = (fieldName: keyof UserProfile, label: string, type: string = "text", options?: { value: string; label: string }[], placeholder?: string) => {
    if (!isOwnProfile && fieldName !== 'teamIds' && fieldName !== 'achievements') { 
      let displayValue: React.ReactNode = profileData[fieldName] || 'Not specified';
      if (fieldName === 'profilePicUrl' && profileData[fieldName]) {
        return null;
      } else if (fieldName === 'date_of_birth' && profileData[fieldName]) {
         try {
           const dateVal = profileData[fieldName];
           if (dateVal) { 
             displayValue = new Date(dateVal as any).toLocaleDateString('en-CA'); 
           } else {
             displayValue = 'Not specified';
           }
         } catch (e) {
            displayValue = profileData[fieldName] as string;
         }
      }
      return (
        <div>
          <label className={labelClass}>{label}</label>
          <div className={`${readOnlyValueClass} bg-gray-750 p-2 rounded-md border border-gray-650`}>
            {displayValue}
          </div>
        </div>
      );
    }
    if (type === "select") {
      return (
        <div>
          <label htmlFor={fieldName} className={labelClass}>{label}</label>
          <select name={fieldName} id={fieldName} value={profileData[fieldName] as string || ''} onChange={handleChange} className={`${inputClass} mt-1`} disabled={!isOwnProfile}>
            {options?.map(opt => <option key={opt.value} value={opt.value} className="bg-gray-700">{opt.label}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div>
        <label htmlFor={fieldName} className={labelClass}>{label}</label>
        <input
            type={type}
            name={fieldName}
            id={fieldName}
            value={(profileData[fieldName] as string | null) || ''}
            onChange={handleChange}
            placeholder={placeholder}
            className={`${inputClass} mt-1`}
            disabled={!isOwnProfile || fieldName === 'email'}
            readOnly={fieldName === 'email'} />
      </div>
    );
  };

  const pageTitle = isOwnProfile ? "My Profile" : `${profileData.username || 'User'}'s Profile`;
  console.log(`[ProfilePage:Render] Rendering affiliated teams. Current state:`, affiliatedTeams, "Teams loading:", teamsLoading);

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <div className="flex items-center space-x-3">
        {paramsUserId && <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeftIcon className="w-5 h-5"/>}>Back</Button>}
        <h1 className="text-3xl font-bold text-gray-50 flex-grow">{pageTitle}</h1>
        {!isOwnProfile && authUserHook && (
             <Button
                variant={isFollowingCurrentUser ? "secondary" : "primary"}
                onClick={handleFollowToggle}
                isLoading={followActionLoading}
                disabled={followActionLoading}
                size="md"
                leftIcon={isFollowingCurrentUser ? <UserMinusIcon className="w-5 h-5"/> : <UserPlusIcon className="w-5 h-5"/>}
              >
                {followActionLoading ? (isFollowingCurrentUser ? 'Unfollowing...' : 'Following...') : (isFollowingCurrentUser ? 'Unfollow' : 'Follow')}
            </Button>
        )}
      </div>

      {error && <p className="mb-4 text-center text-sm text-red-300 bg-red-800 bg-opacity-50 p-3 rounded-md border border-red-700 whitespace-pre-wrap">{error}</p>}
      {successMessage && isOwnProfile && <p className="mb-4 text-center text-sm text-green-300 bg-green-800 bg-opacity-50 p-3 rounded-md border border-green-700">{successMessage}</p>}

      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
          <img
            src={profilePicPreview || `https://picsum.photos/seed/${viewedUserId || 'default'}/150/150`}
            alt="Profile"
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-gray-600 shadow-md"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-100">{profileData.username || "User"}</h2>
            <p className="text-md text-gray-400">{profileData.profileType || "Profile Type Not Set"}</p>
             <div className="mt-3 flex justify-center sm:justify-start space-x-4 text-sm text-gray-300">
                <span><strong className="text-gray-100">{followersCount}</strong> Followers</span>
                <span><strong className="text-gray-100">{followingCount}</strong> Following</span>
            </div>
            {isOwnProfile && (
                <label htmlFor="profilePicFile" className={`mt-3 inline-block ${labelClass} cursor-pointer text-teal-400 hover:text-teal-300 text-sm`}>
                    Change Photo
                </label>
            )}
          </div>
        </div>
         {isOwnProfile && (
              <input
                type="file"
                id="profilePicFile"
                name="profilePicFile"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
                disabled={!isOwnProfile}
              />
         )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderField("username", "Username")}
            {renderField("email", "Email", "email")}
            {renderField("profileType", "Profile Type", "select", [
                { value: "Fan", label: "Fan" },
                { value: "Player", label: "Player" },
                { value: "Scorer", label: "Scorer" },
                { value: "Organizer", label: "Tournament Organizer" },
            ])}
            {renderField("location", "Location", "text", [], "e.g., City, Country")}
            {renderField("date_of_birth", "Date of Birth", "date")}
            {renderField("mobile_number", "Mobile Number", "tel", [], "e.g., +1234567890")}
            {renderField("player_role", "Player Role", "select", [
                { value: "", label: "Not Specified" },
                { value: "Batsman", label: "Batsman" },
                { value: "Bowler", label: "Bowler" },
                { value: "All-rounder", label: "All-rounder" },
                { value: "Wicketkeeper", label: "Wicketkeeper" },
            ])}
            {renderField("batting_style", "Batting Style", "select", [
                { value: "", label: "Not Specified" },
                { value: "Right-hand bat", label: "Right-hand bat" },
                { value: "Left-hand bat", label: "Left-hand bat" },
            ])}
            <div className="md:col-span-2">
                {renderField("bowling_style", "Bowling Style", "text", [], "e.g., Right-arm fast, Left-arm orthodox")}
            </div>
            </div>

            <style>{`.dark-date-picker::-webkit-calendar-picker-indicator { filter: invert(0.8); }`}</style>

            {profileData.achievements && profileData.achievements.length > 0 && (
                <div className="mt-6">
                <h3 className={`${labelClass} mb-2`}>Achievements</h3>
                <div className="flex flex-wrap gap-2">
                    {profileData.achievements.map((achievement, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-700 text-white text-xs font-medium rounded-full">
                        🏆 {achievement}
                    </span>
                    ))}
                </div>
                </div>
            )}

            <div className="mt-6">
                <h3 className={`${labelClass} mb-2 flex items-center`}>
                    <UserGroupIcon className="w-5 h-5 mr-2 text-gray-400"/> Affiliated Teams
                </h3>
                {teamsLoading ? <LoadingSpinner size="sm" /> :
                 affiliatedTeams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {affiliatedTeams.map((team) => (
                        <Link
                            key={team.id}
                            to={`/teams/${team.id}`}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-md shadow-sm transition-colors border border-gray-600"
                        >
                            {team.name}
                        </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">This user is not yet affiliated with any teams.</p>
                )}
            </div>


            {isOwnProfile && (
                <div className="pt-4 flex justify-end">
                <Button type="submit" isLoading={saving} disabled={saving || !isOwnProfile} className="w-full sm:w-auto" variant="primary" size="lg">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;