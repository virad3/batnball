
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types'; // Import UserProfile
import {
  XMarkIcon,
  ChevronRightIcon,
  TrophyIcon,
  PlayCircleIcon,
  VideoCameraIcon,
  CircleStackIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarSquareIcon, 
  ChartPieIcon,     
  SparklesIcon,
  UserPlusIcon,
  ShieldCheckIcon,  
  QueueListIcon,    
  ChevronDownIcon,
  ArrowRightOnRectangleIcon, 
} from '@heroicons/react/24/outline';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string | React.ReactNode; 
  action?: () => void;
  suffixIcon?: React.ElementType;
}

// Function to calculate profile completion percentage
const calculateProfileCompletion = (profile: UserProfile | null): number => {
  if (!profile) return 0;

  const fieldsToConsider: Array<keyof UserProfile> = [
    'profilePicUrl',
    'location',
    'date_of_birth',
    'mobile_number',
    'player_role',
    'batting_style',
    'bowling_style',
  ];

  let completedFields = 0;
  const totalConsideredFields = fieldsToConsider.length;

  fieldsToConsider.forEach(field => {
    const value = profile[field];
    // Check if the value is not null, undefined, and not an empty string
    if (value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : true) ) {
      completedFields++;
    }
  });
  
  // Ensure username and profileType (often set by default) also contribute if desired
  // For this calculation, we are focusing on user-fillable optional fields.
  // If we wanted to include mandatory fields like username, adjust totalConsideredFields and add checks.

  return totalConsideredFields > 0 ? Math.round((completedFields / totalConsideredFields) * 100) : 0;
};


const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onClose(); 
    await logout();
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    { name: "Add a Tournament/Series", path: "/tournaments/new", icon: TrophyIcon }, 
    { name: "Start A Match", path: "/start-match/select-teams", icon: PlayCircleIcon }, 
    { name: "Go Live", path: "/live", icon: VideoCameraIcon }, 
    { name: "Toss", path: "/toss", icon: CircleStackIcon }, 
    { name: "My Matches", path: "/matches", icon: CalendarDaysIcon },
    { name: "My Tournaments", path: "/tournaments", icon: TrophyIcon },
    { name: "My Teams", path: "/my-teams", icon: UserGroupIcon },
    { name: "My Stats", path: "/stats", icon: ChartBarSquareIcon },
    { name: "My Performance", path: "/my-performance", icon: ChartPieIcon },
    { name: "My Highlights", path: "/highlights", icon: SparklesIcon },
    { name: "Find Friends", path: "/find-friends", icon: UserPlusIcon }, 
    { name: "Challenges", path: "/challenges", icon: ShieldCheckIcon },   
    { name: "Leaderboards", path: "/leaderboards", icon: QueueListIcon, suffixIcon: ChevronDownIcon }, 
  ];

  const profileCompletionPercentage = calculateProfileCompletion(userProfile);

  const profilePicUrl = userProfile?.profilePicUrl || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.username || user?.email || 'User')}&background=random&color=fff`;
  const userName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || "User";
  // Use mobile number from profile if available, otherwise a placeholder for display. The calculation uses the actual profile data.
  const userDisplayPhone = userProfile?.mobile_number || "Update Mobile Number"; 


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
                    <p className="text-xs text-slate-300">{userDisplayPhone}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-slate-400 group-hover:text-red-400" />
            </div>
          </NavLink>
          <div className="mt-2 w-full bg-slate-600 rounded-full h-1.5">
            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${profileCompletionPercentage}%` }}></div>
          </div>
          <p className="text-right text-xs text-slate-400 mt-1">{profileCompletionPercentage}%</p>
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
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full`}>
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
