
import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory } from 'react-router-dom'; // useNavigate -> useHistory for v5
import { APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

const AppHeader: React.FC = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userAvatarButtonRef = useRef<HTMLButtonElement>(null);
  const history = useHistory(); // v5 hook

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && 
          !userDropdownRef.current.contains(event.target as Node) &&
          userAvatarButtonRef.current && 
          !userAvatarButtonRef.current.contains(event.target as Node)
         ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = async () => {
    await logout();
    setIsUserDropdownOpen(false);
    history.push('/login'); // Updated navigation
  };
  
  const displayName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || "User";
  const profilePic = userProfile?.profilePicUrl || user?.photoURL || `https://picsum.photos/seed/${user?.uid || 'default'}/40/40`;

  return (
    <header className="bg-gray-800 text-gray-200 shadow-md sticky top-0 z-50 border-b border-gray-700">
      <div className="container mx-auto px-3 sm:px-4 py-2.5 flex justify-between items-center">
        {/* Left Section: Hamburger (optional) & App Logo/Name */}
        <div className="flex items-center">
          {/* Hamburger Icon - can be re-enabled if needed for a drawer */}
          <button
            aria-label="Open menu"
            className="p-2 mr-1 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600 sm:hidden" // Hidden on sm and up for now
            onClick={() => {/* Implement mobile drawer if needed */}}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <Link to="/home" className="flex items-center">
            <img src="/logo.png" alt={`${APP_NAME} Logo`} className="h-8 sm:h-9 w-auto mr-2 rounded-full" />
            {/* App Name can be hidden on very small screens if space is an issue */}
            {/* <span className="font-graduate text-lg sm:text-xl font-normal text-gray-100 hidden sm:block">
              {APP_NAME}
            </span> */}
          </Link>
        </div>

        {/* Center/Right Section: Icons, User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PRO Button Removed */}
          {/* 
          <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-800">
            PRO @ ₹399
          </button> 
          */}
          
          <button aria-label="Search" className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600">
            <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </button>
          <button aria-label="Chat" className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </button>

          {user && ( 
            <div className="relative" ref={userDropdownRef}>
              <button
                ref={userAvatarButtonRef}
                onClick={toggleUserDropdown}
                aria-label="Open user profile menu"
                aria-expanded={isUserDropdownOpen}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <img
                  src={profilePic}
                  alt={displayName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-gray-600 hover:border-red-600 transition-colors"
                />
              </button>
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-xl py-1 z-50 border border-gray-700">
                  <div className="px-4 py-3 mb-1 border-b border-gray-700">
                    <p className="font-semibold text-sm text-gray-100 truncate">{displayName}</p>
                    {userProfile?.profileType && <p className="text-xs text-gray-400 capitalize truncate">{userProfile.profileType}</p>}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={authLoading}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-700 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {authLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
