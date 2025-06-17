import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { UserProfile } from '../types';
import { getCurrentUserProfile } from '../services/dataService';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch user profile for header:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    console.log("User logged out"); // Placeholder for actual logout logic
    setIsMenuOpen(false);
    setUserProfile(null); // Clear profile on logout
    navigate('/home'); 
  };

  const menuItems = [
    { name: 'Edit Profile', path: '/profile' },
    { name: 'My Matches', path: '/matches' },
    { name: 'My Tournaments', path: '/tournaments' },
    { name: 'My Stats', path: '/stats' },
  ];

  return (
    <header className="bg-black text-gray-200 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              aria-label="Open user menu"
              aria-expanded={isMenuOpen}
              className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-md shadow-xl py-2 z-50 border border-gray-700">
                {userProfile ? (
                  <div className="px-4 py-3 mb-2 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <img
                        src={userProfile.profilePicUrl || `https://picsum.photos/seed/${userProfile.id}/40/40`}
                        alt={userProfile.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                      />
                      <div>
                        <p className="font-semibold text-sm text-gray-100">{userProfile.username}</p>
                        <p className="text-xs text-gray-400 capitalize">{userProfile.profileType}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 mb-2 border-b border-gray-700">
                     <p className="text-sm text-gray-300">Guest</p>
                  </div>
                )}
                {userProfile && menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gray-700 mt-2 pt-2">
                  {userProfile ? (
                    <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-700 hover:text-red-300 transition-colors"
                    >
                        Logout
                    </button>
                  ) : (
                     <Link
                        to="/profile" // Or a dedicated login page
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        Login / Sign Up
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/home" className="flex items-center ml-3 sm:ml-4">
            <img src="assets/logo.png" alt="Bat 'n' Ball Logo" className="h-12 w-auto mr-2" />
            <span className="font-graduate text-2xl sm:text-3xl font-normal tracking-wider text-gray-50 [text-shadow:1px_1px_1px_rgba(0,0,0,0.7)]">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div>
          {/* Placeholder for other actions */}
        </div>
      </div>
    </header>
  );
};

export default Header;