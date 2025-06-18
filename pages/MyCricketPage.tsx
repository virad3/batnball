
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, CalendarDaysIcon, ChartBarIcon, SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline'; // Example icons

interface HubLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HubLink: React.FC<HubLinkProps> = ({ to, icon, title, description }) => (
  <Link 
    to={to} 
    className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-all duration-200 ease-in-out flex items-center space-x-4 border border-gray-700 group"
  >
    <div className="flex-shrink-0 w-12 h-12 bg-red-800 text-white rounded-full flex items-center justify-center group-hover:bg-red-700">
      {icon}
    </div>
    <div className="flex-grow">
      <h3 className="text-xl font-semibold text-gray-100 group-hover:text-white">{title}</h3>
      <p className="text-sm text-gray-400 group-hover:text-gray-300">{description}</p>
    </div>
    <ChevronRightIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-300 transition-transform transform group-hover:translate-x-1" />
  </Link>
);


const MyCricketPage: React.FC = () => {
  const hubItems = [
    { to: "/matches", icon: <CalendarDaysIcon className="w-6 h-6" />, title: "My Matches", description: "View upcoming, live, and completed matches." },
    { to: "/tournaments", icon: <ShieldCheckIcon className="w-6 h-6" />, title: "My Tournaments", description: "Manage and track your tournaments." },
    { 
      to: "/my-teams", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          {/* Central figure */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25a3 3 0 100-6 3 3 0 000 6z" /> {/* Head */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25V19.5m-3.75-5.25S9.75 12 12 12s2.25 2.25 2.25 2.25" /> {/* Body/Shoulders */}
          
          {/* Left figure (smaller) */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /> {/* Head */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75v3M5.25 15.75S6 13.5 7.5 13.5s2.25 2.25 2.25 2.25" /> {/* Body/Shoulders */}

          {/* Right figure (smaller) */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 15.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /> {/* Head */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 15.75v3m-2.25-3S15 13.5 16.5 13.5s2.25 2.25 2.25 2.25" /> {/* Body/Shoulders */}
        </svg>
      ), 
      title: "My Teams", 
      description: "Organize your team rosters and details." 
    },
    { to: "/stats", icon: <ChartBarIcon className="w-6 h-6" />, title: "My Stats", description: "Analyze your personal and team statistics." },
    { to: "/highlights", icon: <SparklesIcon className="w-6 h-6" />, title: "Highlights", description: "Relive your best moments and achievements." },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-50 tracking-tight">My Cricket Hub</h1>
        <p className="mt-2 text-lg text-gray-300">Your personal space for all things cricket.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hubItems.map(item => (
          <HubLink key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
};

export default MyCricketPage;
