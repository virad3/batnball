
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom'; // NavLink and useLocation are fine for v5
import { MAIN_NAVIGATION_TAB_ITEMS } from '../constants'; 

const MainUITabs: React.FC = () => {
  const location = useLocation(); // v5 hook

  return (
    <nav className="bg-gray-800 shadow-sm sticky top-[57px] sm:top-[61px] z-40 border-b border-gray-700"> {/* Adjust top value based on AppHeader height */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-around items-center h-12 sm:h-14">
          {MAIN_NAVIGATION_TAB_ITEMS.map((item) => {
            // Special handling for "Matches" tab to be active for "/my-cricket" as well in v5 style
            const isMyCricketMatchesActive = item.name === "Matches" && location.pathname === "/my-cricket";
            let baseClassName = "flex-grow text-center px-1 py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 ease-in-out focus:outline-none relative text-gray-300 hover:text-yellow-300";
            let activeClassName = "text-yellow-400 border-b-2 border-yellow-400";
            
            // If the special condition is met, we override the default active behavior by applying active styles directly
            if (isMyCricketMatchesActive) {
                baseClassName = `flex-grow text-center px-1 py-3 text-xs sm:text-sm font-semibold transition-colors duration-150 ease-in-out focus:outline-none relative ${activeClassName}`;
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={baseClassName}
                activeClassName={!isMyCricketMatchesActive ? activeClassName : ""} // Apply activeClassName only if not already handled
                exact={item.path === "/" || item.path === "/matches"} // Example: be exact for root or specific paths
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
