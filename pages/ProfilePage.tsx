import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { getCurrentUserProfile, updateUserProfile, uploadProfilePicture } from '../services/dataService'; // Now uses Firebase

const ProfilePage: React.FC = () => {
  const { user: authUserHook, userProfile: authContextProfile, loading: authLoading } = useAuth(); // Use userProfile from context
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({});
  const [initialProfileData, setInitialProfileData] = useState<Partial<UserProfile>>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setPageLoading(true);
      if (authContextProfile) { // Prioritize profile from AuthContext if available
        setProfileData(authContextProfile);
        setInitialProfileData(authContextProfile);
        setProfilePicPreview(authContextProfile.profilePicUrl || null);
        setPageLoading(false);
      } else if (authUserHook?.uid && !authLoading) { // Fallback to fetch if context profile not ready but user exists
        try {
          const fullProfile = await getCurrentUserProfile(); // Fetches from Firebase
          if (fullProfile) {
            setProfileData(fullProfile);
            setInitialProfileData(fullProfile);
            setProfilePicPreview(fullProfile.profilePicUrl || null);
          } else {
             // Basic init if nothing found, should be rare if context is working.
            const initial: Partial<UserProfile> = {
                id: authUserHook.uid,
                username: authUserHook.displayName || authUserHook.email?.split('@')[0] || '',
                email: authUserHook.email || '',
                profileType: 'Fan', // Default
                profilePicUrl: authUserHook.photoURL || `https://picsum.photos/seed/${authUserHook.uid}/150/150`,
            };
            setProfileData(initial);
            setInitialProfileData(initial);
            setProfilePicPreview(initial.profilePicUrl || null);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load profile data.");
          console.error("Error loading profile:", err);
        } finally {
          setPageLoading(false);
        }
      } else if (!authLoading) {
        setPageLoading(false);
        setError("User not authenticated or profile context not ready.");
      }
    };

    if (!authLoading) {
        loadProfile();
    }
  }, [authUserHook, authContextProfile, authLoading]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e: ChangeEvent<HTMLInputElement>) => {
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
    if (!authUserHook?.uid) {
      setError("User not authenticated.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let updatedPicUrl = profileData.profilePicUrl; // Start with current or potentially cleared URL
      if (profilePicFile) {
        const uploadedUrl = await uploadProfilePicture(authUserHook.uid, profilePicFile); // Uses Firebase Storage
        if (uploadedUrl) {
          updatedPicUrl = uploadedUrl;
        } else {
          throw new Error("Profile picture upload failed to return a URL.");
        }
      }
      
      const updatesToSave: Partial<UserProfile> = {};
      (Object.keys(profileData) as Array<keyof UserProfile>).forEach(<K extends keyof UserProfile>(key: K) => {
        if (profileData[key] !== initialProfileData[key]) {
          updatesToSave[key] = profileData[key]; 
        }
      });
      
      if (updatedPicUrl !== initialProfileData.profilePicUrl || (profilePicFile && updatedPicUrl)) {
         updatesToSave.profilePicUrl = updatedPicUrl;
      }

      if (Object.keys(updatesToSave).length > 0) {
        console.log("Attempting to save updates (Firebase):", updatesToSave); 
        // updateUserProfile now interacts with Firebase Auth and Firestore
        const { profile: newProfileData, error: updateError } = await updateUserProfile(authUserHook.uid, updatesToSave);

        if (updateError) throw updateError;
        
        if (newProfileData) {
          setProfileData(newProfileData); 
          setInitialProfileData(newProfileData); 
          if (newProfileData.profilePicUrl) setProfilePicPreview(newProfileData.profilePicUrl);
          // AuthContext will update its internal user/userProfile via onAuthStateChanged or by manual refresh if needed
        }
        setProfilePicFile(null); 
        setSuccessMessage("Profile updated successfully!");
      } else {
        setSuccessMessage("No changes to save.");
      }

    } catch (err: any) {
      console.error("Detailed error updating profile (Firebase):", err);
      let errorMessage = "Failed to update profile. Please check console for details.";
      if (err.message) errorMessage = `Failed to update profile: ${err.message}`;
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading || authLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error && !profileData.id && !pageLoading) return <div className="text-center p-8 text-xl text-red-400">{error}</div>;
  if (!authUserHook && !authLoading) return <div className="text-center p-8 text-xl text-gray-300">Please log in to view your profile.</div>;


  const inputClass = "block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-100 placeholder-gray-400";
  const labelClass = "block text-sm font-medium text-gray-300";

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold text-gray-50 text-center">My Profile</h1>
      
      {error && <p className="mb-4 text-center text-sm text-red-300 bg-red-800 bg-opacity-50 p-3 rounded-md border border-red-700 whitespace-pre-wrap">{error}</p>}
      {successMessage && <p className="mb-4 text-center text-sm text-green-300 bg-green-800 bg-opacity-50 p-3 rounded-md border border-green-700">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <img
            src={profilePicPreview || `https://picsum.photos/seed/${authUserHook?.uid || 'default'}/150/150`}
            alt="Profile"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-600 shadow-md"
          />
          <div>
            <label htmlFor="profilePicFile" className={`${labelClass} cursor-pointer text-red-400 hover:text-red-300`}>
              Change Photo
            </label>
            <input
              type="file"
              id="profilePicFile"
              name="profilePicFile"
              accept="image/*"
              onChange={handleProfilePicChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="username" className={labelClass}>Username</label>
            <input type="text" name="username" id="username" value={profileData.username || ''} onChange={handleChange} className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input type="email" name="email" id="email" value={profileData.email || ''} readOnly disabled className={`${inputClass} mt-1 bg-gray-600 cursor-not-allowed`} />
          </div>
          <div>
            <label htmlFor="profileType" className={labelClass}>Profile Type</label>
            <select name="profileType" id="profileType" value={profileData.profileType || 'Fan'} onChange={handleChange} className={`${inputClass} mt-1`}>
              <option value="Fan">Fan</option>
              <option value="Player">Player</option>
              <option value="Scorer">Scorer</option>
              <option value="Organizer">Tournament Organizer</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>Location</label>
            <input type="text" name="location" id="location" value={profileData.location || ''} onChange={handleChange} placeholder="e.g., City, Country" className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label htmlFor="date_of_birth" className={labelClass}>Date of Birth</label>
            <input type="date" name="date_of_birth" id="date_of_birth" value={profileData.date_of_birth || ''} onChange={handleChange} className={`${inputClass} mt-1 dark-date-picker`} />
          </div>
          <div>
            <label htmlFor="mobile_number" className={labelClass}>Mobile Number</label>
            <input type="tel" name="mobile_number" id="mobile_number" value={profileData.mobile_number || ''} onChange={handleChange} placeholder="e.g., +1234567890" className={`${inputClass} mt-1`} />
          </div>
           <div>
            <label htmlFor="player_role" className={labelClass}>Player Role</label>
            <select name="player_role" id="player_role" value={profileData.player_role || ''} onChange={handleChange} className={`${inputClass} mt-1`}>
              <option value="">Not Specified</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicketkeeper">Wicketkeeper</option>
            </select>
          </div>
          <div>
            <label htmlFor="batting_style" className={labelClass}>Batting Style</label>
            <select name="batting_style" id="batting_style" value={profileData.batting_style || ''} onChange={handleChange} className={`${inputClass} mt-1`}>
              <option value="">Not Specified</option>
              <option value="Right-hand bat">Right-hand bat</option>
              <option value="Left-hand bat">Left-hand bat</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="bowling_style" className={labelClass}>Bowling Style</label>
            <input type="text" name="bowling_style" id="bowling_style" value={profileData.bowling_style || ''} onChange={handleChange} placeholder="e.g., Right-arm fast, Left-arm orthodox" className={`${inputClass} mt-1`} />
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

        <div className="pt-4">
          <Button type="submit" isLoading={saving} disabled={saving} className="w-full sm:w-auto" variant="primary" size="lg">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;