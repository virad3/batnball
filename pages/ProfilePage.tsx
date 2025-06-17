
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { getCurrentUserProfile, updateUserProfile, uploadProfilePicture } from '../services/dataService';

const ProfilePage: React.FC = () => {
  const { user: authUser, loading: authLoading } = useAuth();
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
      if (authUser?.id) {
        setPageLoading(true);
        try {
          const fullProfile = await getCurrentUserProfile(); // Uses getFullUserProfile internally
          if (fullProfile) {
            setProfileData(fullProfile);
            setInitialProfileData(fullProfile); // Store initial for comparison
            setProfilePicPreview(fullProfile.profilePicUrl || null);
          } else {
            // Initialize with authUser data if no DB profile yet
            const initial: Partial<UserProfile> = {
              id: authUser.id,
              username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || '',
              email: authUser.email || '',
              profileType: authUser.user_metadata?.profile_type || 'Fan',
              profilePicUrl: authUser.user_metadata?.profile_pic_url || `https://picsum.photos/seed/${authUser.id}/150/150`,
            };
            setProfileData(initial);
            setInitialProfileData(initial);
            setProfilePicPreview(initial.profilePicUrl || null);
          }
        } catch (err: any) {
          setError(err.message || "Failed to load profile data.");
          console.error(err);
        } finally {
          setPageLoading(false);
        }
      } else if (!authLoading) { // If auth is done loading and no authUser
        setPageLoading(false);
        setError("User not authenticated.");
      }
    };

    if (!authLoading) {
        loadProfile();
    }
  }, [authUser, authLoading]);

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
    if (!authUser?.id) {
      setError("User not authenticated.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let updatedPicUrl = profileData.profilePicUrl;
      if (profilePicFile) {
        const uploadedUrl = await uploadProfilePicture(authUser.id, profilePicFile);
        if (uploadedUrl) {
          updatedPicUrl = uploadedUrl;
        } else {
          throw new Error("Profile picture upload failed to return a URL.");
        }
      }
      
      const updatesToSave: Partial<UserProfile> = {};
      // Compare with initialProfileData to send only changed fields
      (Object.keys(profileData) as Array<keyof UserProfile>).forEach(key => {
        if (profileData[key] !== initialProfileData[key]) {
          updatesToSave[key] = profileData[key]; 
        }
      });
      
      // Ensure the potentially new profilePicUrl is part of the updates if it changed
      if (updatedPicUrl !== initialProfileData.profilePicUrl) {
         updatesToSave.profilePicUrl = updatedPicUrl;
      }


      if (Object.keys(updatesToSave).length > 0 || profilePicFile) { // Check if there's anything to save
        const { profile: newProfileData, error: updateError } = await updateUserProfile(authUser.id, {
          ...updatesToSave, // Send only changed fields
          profilePicUrl: updatedPicUrl, // Always send the latest pic URL (new or old)
        });

        if (updateError) throw updateError;
        
        if (newProfileData) {
          setProfileData(newProfileData); // Update local state with merged data from DB
          setInitialProfileData(newProfileData); // Reset initial data to new saved state
          if (newProfileData.profilePicUrl) setProfilePicPreview(newProfileData.profilePicUrl);
        }
        setProfilePicFile(null); // Clear file after successful upload
        setSuccessMessage("Profile updated successfully!");
      } else {
        setSuccessMessage("No changes to save.");
      }

    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading || authLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error && !profileData.id) return <div className="text-center p-8 text-xl text-red-400">{error}</div>; // Show error if critical like user not found

  const inputClass = "block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-100 placeholder-gray-400";
  const labelClass = "block text-sm font-medium text-gray-300";

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold text-gray-50 text-center">My Profile</h1>
      
      {error && <p className="mb-4 text-center text-sm text-red-300 bg-red-800 bg-opacity-50 p-3 rounded-md border border-red-700">{error}</p>}
      {successMessage && <p className="mb-4 text-center text-sm text-green-300 bg-green-800 bg-opacity-50 p-3 rounded-md border border-green-700">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex flex-col items-center space-y-4">
          <img
            src={profilePicPreview || `https://picsum.photos/seed/${authUser?.id || 'default'}/150/150`}
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
