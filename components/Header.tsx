
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, COLORS } from '../constants';
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
    console.log("User logged out");
    setIsMenuOpen(false);
    navigate('/home'); // Navigate to home or a login page
  };

  const menuItems = [
    { name: 'Edit Profile', path: '/profile' },
    { name: 'My Matches', path: '/matches' },
    { name: 'My Tournaments', path: '/tournaments' },
    { name: 'My Teams', path: '/profile/my-teams' },
    { name: 'My Stats', path: '/stats' },
    { name: 'My Performance', path: '/profile/my-performance' },
  ];

  return (
    <header className="bg-[#004d40] text-[#f9fbe7] shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left Aligned Group: Hamburger, Logo, App Name */}
        <div className="flex items-center">
          {/* Hamburger Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              aria-label="Open user menu"
              aria-expanded={isMenuOpen}
              className="p-2 rounded-full hover:bg-[#00382e] focus:outline-none focus:ring-2 focus:ring-[#f9fbe7]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-xl py-2 z-50 text-[#004d40]">
                {userProfile && (
                  <div className="px-4 py-3 mb-2 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <img
                        src={userProfile.profilePicUrl || `https://picsum.photos/seed/${userProfile.id}/40/40`}
                        alt={userProfile.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#004d40]"
                      />
                      <div>
                        <p className="font-semibold text-sm">{userProfile.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{userProfile.profileType}</p>
                      </div>
                    </div>
                  </div>
                )}
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-[#d32f2f] hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logo and App Name (Link to home) */}
          <Link to="/home" className="flex items-center ml-3 sm:ml-4"> {/* Added margin for spacing from hamburger */}
            <img src='/logo.png' alt="Bat&Ball Logo" className="h-8 w-auto mr-2" /> {/* Logo */}
            <span className="text-xl sm:text-2xl font-bold tracking-tight">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Right Aligned Group (currently empty, can be used for other actions later) */}
        <div>
          {/* Example: ممكن هنا أيقونة إشعارات أو بحث */}
        </div>
      </div>
    </header>
  );
};

export default Header;
