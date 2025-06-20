
import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  
  return totalConsideredFields > 0 ? Math.round((completedFields / totalConsideredFields) * 100) : 0;
};


const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const profilePicUrl = userProfile?.profilePicUrl || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.username || user?.email || 'User')}&background=4B5563&color=E5E7EB`; // Darker avatar bg
  const userName = userProfile?.username || user?.displayName || user?.email?.split('@')[0] || "User";
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
        className={`fixed top-0 left-0 bottom-0 z-50 flex w-72 sm:w-80 flex-col bg-gray-800 shadow-xl transition-transform duration-300 ease-in-out ${ // Changed main bg to gray-800
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-menu-title"
      >
        {/* Header (User Profile Section) */}
        <div className="bg-gray-800 p-4 text-gray-100 border-b border-gray-700"> {/* Consistent header bg */}
          <div className="flex justify-between items-center mb-3">
            <h2 id="side-menu-title" className="sr-only">Main Menu</h2>
            <img
              src={profilePicUrl}
              alt={userName}
              className="h-16 w-16 rounded-full border-2 border-gray-600 object-cover" // Adjusted border
            />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-100 p-1"> {/* Adjusted text color */}
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <NavLink to="/profile" onClick={onClose} className="block group">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold group-hover:text-yellow-400">{userName}</h3> {/* Yellow hover for name */}
                    <p className="text-xs text-gray-400">{userDisplayPhone}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-yellow-400" /> {/* Yellow hover for icon */}
            </div>
          </NavLink>
          <div className="mt-2 w-full bg-gray-600 rounded-full h-1.5"> {/* Darker progress bg */}
            <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${profileCompletionPercentage}%` }}></div> {/* Teal progress bar */}
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">{profileCompletionPercentage}%</p>
        </div>


        {/* Menu Items Section */}
        <nav className="flex-1 overflow-y-auto bg-gray-800 text-gray-200"> {/* Darker bg, lighter text */}
          <ul>
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (item.action) item.action();
                    onClose();
                  }}
                  className={({ isActive }) => // isActive is from react-router-dom
                    `flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-700 ${ // Darker hover
                      isActive ? 'bg-gray-700 text-yellow-400' : 'text-gray-200' // Active state uses yellow
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                      location.pathname.startsWith(item.path) && (item.path !== "/" || location.pathname === "/") ? 'text-yellow-400' : 'text-gray-400' // Active icon yellow
                    }`} />
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
        <div className="border-t border-gray-700 p-2 bg-gray-800"> {/* Darker footer */}
            <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-700 hover:text-red-100 rounded-md transition-colors" // Adjusted hover for logout
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