
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAVIGATION_TAB_ITEMS } from '../constants'; // Assuming this will be defined

const MainUITabs: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-gray-800 shadow-sm sticky top-[57px] sm:top-[61px] z-40 border-b border-gray-700"> {/* Adjust top value based on AppHeader height */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center h-12 sm:h-14">
          {MAIN_NAVIGATION_TAB_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex-grow text-center px-1 py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 ease-in-out focus:outline-none relative
                 ${isActive 
                    ? 'text-yellow-400 border-b-2 border-yellow-400' 
                    : 'text-gray-300 hover:text-yellow-300'
                 }`
              }
            >
              {item.name.toUpperCase()}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default MainUITabs;
