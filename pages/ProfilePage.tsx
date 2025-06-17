import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types'; 
import { getCurrentUserProfile } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!userProfile) return <div className="text-center p-8 text-xl text-red-400">Could not load profile.</div>;


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <img 
            src={userProfile.profilePicUrl || `https://picsum.photos/seed/${userProfile.id}/150/150`} 
            alt={userProfile.username}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-600 shadow-md flex-shrink-0"
          />
          <div className="text-center sm:text-left flex-grow mt-2 sm:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-50">{userProfile.username}</h1>
            <p className="text-md text-gray-300 capitalize mt-1">{userProfile.profileType}</p>
            {userProfile.email && <p className="text-sm text-gray-400 mt-1">{userProfile.email}</p>}
            <div className="mt-5">
                <Button variant="outline" size="sm" onClick={() => alert("Edit profile functionality coming soon!")}>Edit Profile</Button>
            </div>
          </div>
        </div>
      </section>

      {userProfile.achievements && userProfile.achievements.length > 0 && (
        <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Achievements & Badges</h2>
          <div className="flex flex-wrap gap-3">
            {userProfile.achievements.map((achievement, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-full shadow-md">
                🏆 {achievement}
              </span>
            ))}
          </div>
        </section>
      )}
      
        <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Settings</h2>
            <p className="text-gray-300">Application settings and user preferences will appear here in a future update.</p>
            <p className="text-sm text-gray-400 mt-2">Currently, logout is available via the menu in the header.</p>
        </section>
    </div>
  );
};

export default ProfilePage;