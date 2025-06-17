
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, Player, Team } from '../types';
import { getCurrentUserProfile, mockPlayers, mockTeams } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { COLORS } from '../constants';


const ProfilePage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await getCurrentUserProfile(); // This will return mock data
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
  if (!userProfile) return <div className="text-center p-8 text-xl text-[#d32f2f]">Could not load profile.</div>;

  const StatItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-2xl font-bold text-[#004d40]">{value}</p>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="bg-white p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <img 
            src={userProfile.profilePicUrl || `https://picsum.photos/seed/${userProfile.id}/150/150`} 
            alt={userProfile.username}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#004d40] shadow-md"
          />
          <div className="text-center sm:text-left flex-grow">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#004d40]">{userProfile.username}</h1>
            <p className="text-md text-gray-600 capitalize">{userProfile.profileType}</p>
            {userProfile.email && <p className="text-sm text-gray-500 mt-1">{userProfile.email}</p>}
            <div className="mt-4">
                <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </div>
        </div>
        
        {userProfile.profileType === "Player" && (
            <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
                <StatItem label="Matches" value={Math.floor(Math.random()*50)} />
                <StatItem label="Runs" value={Math.floor(Math.random()*1500)} />
                <StatItem label="Wickets" value={Math.floor(Math.random()*70)} />
            </div>
        )}
      </section>

      {userProfile.achievements && userProfile.achievements.length > 0 && (
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-[#004d40] mb-4">Achievements & Badges</h2>
          <div className="flex flex-wrap gap-3">
            {userProfile.achievements.map((achievement, idx) => (
              <span key={idx} className="px-3 py-1 bg-[#d32f2f] text-white text-sm font-medium rounded-full shadow">
                🏆 {achievement}
              </span>
            ))}
          </div>
        </section>
      )}

      {(userProfile.followedPlayers && userProfile.followedPlayers.length > 0) || (userProfile.followedTeams && userProfile.followedTeams.length > 0) ? (
        <section className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-[#004d40] mb-4">Following</h2>
          {userProfile.followedPlayers && userProfile.followedPlayers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Players:</h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.followedPlayers.map(player => (
                  <Link key={player.id} to={`/players/${player.id}`} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <img src={player.profilePicUrl || `https://picsum.photos/seed/${player.id}/30/30`} alt={player.name} className="w-6 h-6 rounded-full object-cover"/>
                    <span className="text-sm text-[#004d40]">{player.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {userProfile.followedTeams && userProfile.followedTeams.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-2">Teams:</h3>
               <div className="flex flex-wrap gap-2">
                {userProfile.followedTeams.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                     <img src={team.logoUrl || `https://picsum.photos/seed/${team.id}/30/30`} alt={team.name} className="w-6 h-6 rounded-full object-cover"/>
                    <span className="text-sm text-[#004d40]">{team.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}
        <section className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-[#004d40] mb-4">Settings</h2>
            {/* Placeholder for settings options */}
            <p className="text-gray-600">App settings and preferences will appear here.</p>
            <div className="mt-4">
                <Button variant="danger" size="sm">Logout</Button>
            </div>
        </section>
    </div>
  );
};

export default ProfilePage;
