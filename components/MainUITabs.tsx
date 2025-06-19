
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAVIGATION_TAB_ITEMS } from '../constants'; 

const MainUITabs: React.FC = () => {
  const location = useLocation();

  const baseTabStyles = "flex-grow text-center px-1 py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 ease-in-out focus:outline-none relative";
  const activeTabStyles = "text-yellow-400 border-b-2 border-yellow-400";
  const inactiveTabStyles = "text-gray-300 hover:text-yellow-300";

  return (
    <nav className="bg-gray-800 shadow-sm sticky top-[57px] sm:top-[61px] z-40 border-b border-gray-700"> {/* Adjust top value based on AppHeader height */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center h-12 sm:h-14">
          {MAIN_NAVIGATION_TAB_ITEMS.map((item) => {
            // Special handling for "Matches" tab to be active for "/my-cricket" as well
            const isMyCricketContextActiveForMatches = item.name === "Matches" && location.pathname === "/my-cricket";
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `${baseTabStyles} ${isMyCricketContextActiveForMatches || isActive ? activeTabStyles : inactiveTabStyles}`
                }
              >
                {item.name.toUpperCase()}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MainUITabs;
