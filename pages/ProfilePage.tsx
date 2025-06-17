import React from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const ProfilePage: React.FC = () => {
  const { user, loading: authLoading, userProfileType } = useAuth(); // Get user and loading state from AuthContext

  if (authLoading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!user) return <div className="text-center p-8 text-xl text-red-400">Please login to view your profile.</div>;

  // Attempt to get username from metadata, fallback to email part
  const usernameDisplay = user.user_metadata?.username || user.email?.split('@')[0] || "User";
  const emailDisplay = user.email || "No email provided";
  const profilePic = user.user_metadata?.profile_pic_url || `https://picsum.photos/seed/${user.id}/150/150`;
  // Achievements would need to be fetched from a separate 'profiles' table linked to the user.id
  // For now, this will be empty or use a placeholder.
  const achievements: string[] = user.user_metadata?.achievements || []; 
  const profileTypeDisplay = userProfileType || user.user_metadata?.profile_type || "Registered User";


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-gray-700">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <img 
            src={profilePic}
            alt={usernameDisplay}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-600 shadow-md flex-shrink-0"
          />
          <div className="text-center sm:text-left flex-grow mt-2 sm:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-50">{usernameDisplay}</h1>
            <p className="text-md text-gray-300 capitalize mt-1">{profileTypeDisplay}</p>
            <p className="text-sm text-gray-400 mt-1">{emailDisplay}</p>
            <div className="mt-5">
                <Button variant="outline" size="sm" onClick={() => alert("Edit profile functionality (e.g., updating Supabase user_metadata or a profiles table) coming soon!")}>Edit Profile</Button>
            </div>
          </div>
        </div>
      </section>

      {achievements && achievements.length > 0 && (
        <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Achievements & Badges</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((achievement, idx) => (
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