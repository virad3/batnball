import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext'; 
import CoinTossModal from './CoinTossModal'; // Import the new modal

interface MainMenuItem {
  name: string;
  path?: string;
  onClick?: () => void;
}

const Header: React.FC = () => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isCoinTossModalOpen, setIsCoinTossModalOpen] = useState(false); // State for coin toss modal
  
  const { user, userProfile, logout, loading: authLoading } = useAuth(); 
  
  const mainMenuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userAvatarButtonRef = useRef<HTMLButtonElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target as Node)) {
        setIsMainMenuOpen(false);
      }
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

  const toggleMainMenu = () => {
    setIsMainMenuOpen(!isMainMenuOpen);
    if (isUserDropdownOpen) setIsUserDropdownOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    if (isMainMenuOpen) setIsMainMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMainMenuOpen(false);
    setIsUserDropdownOpen(false);
    navigate('/login'); 
  };

  const openCoinTossModal = () => {
    setIsCoinTossModalOpen(true);
    setIsMainMenuOpen(false); // Close main menu if open
  };

  const closeCoinTossModal = () => {
    setIsCoinTossModalOpen(false);
  };

  const handleProceedFromToss = () => {
    closeCoinTossModal();
    navigate('/matches/newmatch/score');
  };

  const mainMenuItems: MainMenuItem[] = [
    { name: 'My Matches', path: '/matches' },
    { name: 'My Tournaments', path: '/tournaments' },
    { name: 'My Teams', path: '/my-teams' },
    { name: 'My Performance', path: '/my-performance' },
    { name: 'Toss', onClick: openCoinTossModal }, // Changed to onClick
    // { name: 'My Stats', path: '/stats' }, // Removed My Stats
  ];
  
  const displayName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || "User";
  const profileTypeDisplay = userProfile?.profileType || (user ? "Registered" : "Guest");
  const profilePic = userProfile?.profilePicUrl || user?.photoURL || `https://picsum.photos/seed/${user?.uid || 'default'}/40/40`;


  return (
    <>
      <header className="bg-black text-gray-200 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Left Section: Hamburger Menu & App Logo/Name */}
          <div className="flex items-center">
            <div className="relative" ref={mainMenuRef}>
              <button
                onClick={toggleMainMenu}
                aria-label="Open main menu"
                aria-expanded={isMainMenuOpen}
                className="p-2 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 focus:ring-offset-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              {isMainMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-md shadow-xl py-2 z-50 border border-gray-700">
                  {user && mainMenuItems.map((item) => (
                    item.path ? (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMainMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <button
                        key={item.name}
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          setIsMainMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        {item.name}
                      </button>
                    )
                  ))}
                   {!user && !authLoading && ( 
                      <Link
                          to="/login" 
                          onClick={() => setIsMainMenuOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                          Login / Sign Up
                      </Link>
                    )}
                </div>
              )}
            </div>

            <Link to="/home" className="flex items-center ml-3 sm:ml-4">
              <img src="/logo.png" alt="Bat 'n' Ball Logo" className="h-10 sm:h-12 w-auto mr-2" />
              <span className="font-graduate text-xl sm:text-3xl font-normal tracking-wider text-gray-50 [text-shadow:1px_1px_1px_rgba(0,0,0,0.7)]">
                {APP_NAME}
              </span>
            </Link>
          </div>

          {/* Right Section: User Profile Actions */}
          <div className="ml-auto flex items-center">
            {user ? ( 
              <div className="relative" ref={userDropdownRef}>
                <button
                  ref={userAvatarButtonRef}
                  onClick={toggleUserDropdown}
                  aria-label="Open user profile menu"
                  aria-expanded={isUserDropdownOpen}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 focus:ring-offset-black"
                >
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-600 hover:border-red-700 transition-colors"
                  />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-xl py-2 z-50 border border-gray-700">
                    <div className="px-4 py-3 mb-2 border-b border-gray-700">
                      <p className="font-semibold text-sm text-gray-100 truncate">{displayName}</p>
                      <p className="text-xs text-gray-400 capitalize truncate">{profileTypeDisplay}</p>
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
            ) : (
              !authLoading && null 
            )}
          </div>
        </div>
      </header>
      <CoinTossModal 
        isOpen={isCoinTossModalOpen}
        onClose={closeCoinTossModal}
        onProceed={handleProceedFromToss}
      />
    </>
  );
};

export default Header;