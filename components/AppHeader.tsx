
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, MagnifyingGlassIcon, ChatBubbleLeftEllipsisIcon, BellIcon } from '@heroicons/react/24/outline';

interface AppHeaderProps {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onSearchClick, onMenuClick }) => {
  const { user } = useAuth(); // Simplified useAuth, only need 'user' for conditional rendering
  const navigate = useNavigate();

  const handleNotificationClick = () => {
    // Placeholder for notification panel logic
    console.log("Notification icon clicked. Implement notification panel here.");
    // Example: navigate('/notifications');
  };

  return (
    <header className="bg-gray-800 text-gray-200 shadow-md sticky top-0 z-30 border-b border-gray-700 h-[57px] sm:h-[61px] flex items-center">
      <div className="container mx-auto px-3 sm:px-4 flex justify-between items-center">
        <div className="flex items-center">
          {user && ( // Show hamburger only if user is logged in (as menu content is user-specific)
            <button
              aria-label="Open menu"
              className="p-2 mr-1 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600 sm:hidden"
              onClick={onMenuClick}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          )}
          
          <Link to="/home" className="flex items-center">
            <img src="/logo.png" alt={`${APP_NAME} Logo`} className="h-8 sm:h-9 w-auto mr-2 rounded-full" />
          </Link>
        </div>

        {user && ( // Only show these icons if a user is logged in
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
              onClick={onSearchClick}
            >
              <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            </button>
            <button aria-label="Chat" className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600">
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
            </button>
            <button
              aria-label="Notifications"
              onClick={handleNotificationClick}
              className="relative p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
              {/* Static notification dot indicator */}
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-800 transform translate-x-1/4 -translate-y-1/4">
                <span className="sr-only">New notifications</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
