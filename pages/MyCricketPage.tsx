
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
    // "My Teams" link removed as per new navigation structure
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
        {hubItems.length === 0 && (
             <p className="text-center text-gray-400 col-span-1 md:col-span-2 py-8">
                More features coming soon to your cricket hub!
            </p>
        )}
      </div>
    </div>
  );
};

export default MyCricketPage;
