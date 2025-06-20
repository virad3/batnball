
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  XMarkIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  TrophyIcon,
  PlayCircleIcon,
  VideoCameraIcon,
  CircleStackIcon, // Placeholder for Toss
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarSquareIcon, // For My Stats
  ChartPieIcon,     // For My Performance
  SparklesIcon,
  UserPlusIcon,
  ShieldCheckIcon,  // For Challenges
  QueueListIcon,    // For Leaderboards
  ChevronDownIcon,
  ArrowRightOnRectangleIcon, // For Logout
  PresentationChartBarIcon // For PRO banner
} from '@heroicons/react/24/outline';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string | React.ReactNode; // For "FREE" or emoji
  action?: () => void;
  suffixIcon?: React.ElementType;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose(); // Close menu first
    await logout();
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    { name: "CricHeroes Store", path: "/store", icon: ShoppingBagIcon, badge: <span role="img" aria-label="jersey">👕</span> },
    { name: "Add a Tournament/Series", path: "/tournaments/new", icon: TrophyIcon, badge: "FREE" },
    { name: "Start A Match", path: "/start-match/select-teams", icon: PlayCircleIcon, badge: "FREE" },
    { name: "Go Live", path: "/live", icon: VideoCameraIcon }, // Placeholder path
    { name: "Toss", path: "/toss", icon: CircleStackIcon }, // Placeholder path
    { name: "My Matches", path: "/matches", icon: CalendarDaysIcon },
    { name: "My Tournaments", path: "/tournaments", icon: TrophyIcon },
    { name: "My Teams", path: "/my-teams", icon: UserGroupIcon },
    { name: "My Stats", path: "/stats", icon: ChartBarSquareIcon },
    { name: "My Performance", path: "/my-performance", icon: ChartPieIcon },
    { name: "My Highlights", path: "/highlights", icon: SparklesIcon },
    { name: "Find Friends", path: "/find-friends", icon: UserPlusIcon }, // Placeholder path
    { name: "Challenges", path: "/challenges", icon: ShieldCheckIcon },   // Placeholder path
    { name: "Leaderboards", path: "/leaderboards", icon: QueueListIcon, suffixIcon: ChevronDownIcon }, // Placeholder path
  ];

  const profilePicUrl = userProfile?.profilePicUrl || user?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.username || user?.email || 'User'}&background=random&color=fff`;
  const userName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || "User";
  // Placeholder phone, replace with actual data if available
  const userPhone = userProfile?.mobile_number || "+91 80894 16687"; 


  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Side Menu Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 flex w-72 sm:w-80 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-menu-title"
      >
        {/* Header (User Profile Section) */}
        <div className="bg-slate-800 p-4 text-white">
          <div className="flex justify-between items-center mb-3">
            <h2 id="side-menu-title" className="sr-only">Main Menu</h2>
            <img
              src={profilePicUrl}
              alt={userName}
              className="h-16 w-16 rounded-full border-2 border-slate-500 object-cover"
            />
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <NavLink to="/profile" onClick={onClose} className="block group">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold group-hover:text-red-400">{userName}</h3>
                    <p className="text-xs text-slate-300">{userPhone}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-400 group-hover:text-red-400" />
            </div>
          </NavLink>
          <div className="mt-3">
            <span className="inline-block bg-slate-100 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              Free User
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-600 rounded-full h-1.5">
            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">88%</p>
        </div>

        {/* PRO Banner Section */}
        <div className="bg-slate-700 p-4 text-white flex items-center space-x-3">
          <PresentationChartBarIcon className="h-7 w-7 text-yellow-400" />
          <div>
            <p className="font-semibold">PRO @ <span className="font-sans">₹</span>399/YEAR</p>
            <p className="text-xs text-slate-300">Unlock premium features!</p>
          </div>
        </div>

        {/* Menu Items Section */}
        <nav className="flex-1 overflow-y-auto bg-gray-50 text-gray-700">
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (item.action) item.action();
                    onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-200 ${
                      isActive ? 'bg-red-100 text-red-700' : 'text-gray-700'
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 mr-3 ${item.path.startsWith(location.pathname) && item.path !== "/" ? 'text-red-600' : 'text-gray-500'}`} />
                  <span className="flex-grow">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        typeof item.badge === 'string' && item.badge === "FREE" ? 'bg-yellow-400 text-yellow-900' : ''
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.suffixIcon && <item.suffixIcon className="h-4 w-4 text-gray-400 ml-auto" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Footer actions like Logout */}
        <div className="border-t border-gray-200 p-2 bg-gray-50">
            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 rounded-md transition-colors"
            >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                Logout
            </button>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
