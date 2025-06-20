
import React from 'react';
import { 
  HomeIcon, MagnifyingGlassIcon, UserGroupIcon, BuildingStorefrontIcon, PresentationChartBarIcon, TrophyIcon, ShieldCheckIcon, SparklesIcon, CogIcon 
} from '@heroicons/react/24/outline'; // More icons

export const APP_NAME = "BAT 'n' BALL";

export const COLORS = {
  accentRed: "#991b1b", 
  darkText: "#1a202c", 
  lightText: "#f7fafc", 
};

// Define CalendarDaysIcon before it's used
export const CalendarDaysIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008z" />
  </svg>
);

// Added ChartBarSquareIcon definition if not available directly from heroicons/outline
export const ChartBarSquareIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
);


// For the main UI tabs below AppHeader
export const MAIN_NAVIGATION_TAB_ITEMS = [
  { name: "Matches", path: "/matches", icon: <CalendarDaysIcon className="w-5 h-5" /> },
  { name: "Tournaments", path: "/tournaments", icon: <TrophyIcon className="w-5 h-5" /> },
  { name: "Teams", path: "/teams", icon: <UserGroupIcon className="w-5 h-5" /> }, // Path changed to /teams
  { name: "Stats", path: "/stats", icon: <PresentationChartBarIcon className="w-5 h-5" /> },
  { name: "Highlights", path: "/highlights", icon: <SparklesIcon className="w-5 h-5" /> },
];

// For the Bottom Navigation bar (mobile)
export const NAV_ITEMS_BOTTOM = [
  {
    name: "Home",
    path: "/home",
    icon: <HomeIcon className="w-6 h-6" />,
  },
  {
    name: "Looking", // "Discover" or "Explore"
    path: "/looking",
    icon: <MagnifyingGlassIcon className="w-6 h-6" />,
  },
  {
    name: "My Cricket",
    path: "/my-cricket", // This links to the MyCricketPage hub
    icon: ( // Bat and Ball icon
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 2.25L7.5 9l-1.5 1.5L8.25 12l1.5-1.5 6.75-6.75-1.5-1.5zM7.5 9L3 13.5l1.5 1.5L9 10.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 15a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    name: "Community",
    path: "/community", // Placeholder path, page not yet created
    icon: <UserGroupIcon className="w-6 h-6" />,
  },
  // { // Store item removed
  //   name: "Store",
  //   path: "/store", 
  //   icon: <BuildingStorefrontIcon className="w-6 h-6" />,
  // },
];

export const MOCK_API_KEY = "YOUR_GEMINI_API_KEY"; // Placeholder

// UserCircleIcon and CogIcon could also be defined here if needed frequently for consistency
