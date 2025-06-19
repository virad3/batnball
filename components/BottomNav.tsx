
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS_BOTTOM } from '../constants'; // Renamed NAV_ITEMS to NAV_ITEMS_BOTTOM for clarity

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-400 shadow-t-lg border-t border-gray-700 sm:hidden z-40">
      <div className="container mx-auto flex justify-around">
        {NAV_ITEMS_BOTTOM.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2.5 w-1/5 text-xs transition-colors duration-200 ease-in-out
               ${isActive ? 'text-yellow-400 bg-gray-800' : 'hover:bg-gray-800 hover:text-gray-200'}`
            }
            title={item.name}
          >
            {item.icon}
            <span className="mt-1 whitespace-nowrap">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
