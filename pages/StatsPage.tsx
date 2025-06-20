
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

type StatsFilterTabs = 'overview' | 'matches';

const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatsFilterTabs>('overview'); 

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setLoading(false);
    };
    loadData();
  }, []);

  const TabButton: React.FC<{
    label: string;
    filterKey: StatsFilterTabs;
  }> = ({ label, filterKey }) => {
    const isActive = activeTab === filterKey;
    return (
      <button
        onClick={() => setActiveTab(filterKey)}
        className={`px-4 py-3 sm:px-6 text-sm font-medium focus:outline-none transition-colors duration-150
          ${isActive 
            ? 'bg-gray-100 text-gray-900 rounded-t-lg shadow' 
            : 'text-gray-400 hover:text-gray-200'
          }
        `}
        role="tab"
        aria-selected={isActive}
      >
        {label}
      </button>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-50">Statistics</h1>

      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-1 sm:space-x-2" aria-label="Stats Filters">
          <TabButton label="Overview" filterKey="overview" />
          <TabButton label="Match Stats (Soon)" filterKey="matches" />
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 text-center border border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Overall Statistics</h2>
          <img src="https://picsum.photos/seed/stats-placeholder/400/250" alt="Stats placeholder" className="mx-auto rounded-lg mb-6 shadow-md border border-gray-700"/>
          <p className="text-gray-300">
            Welcome to the Statistics section! Detailed statistics based on matches and tournaments will be displayed here.
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            As player and specific team data has been streamlined, this section is currently under redevelopment to provide meaningful aggregate statistics.
            Please check back later for updates.
          </p>
        </div>
      )}

      {activeTab === 'matches' && (
         <div className="bg-gray-800 shadow-lg rounded-lg p-6 text-center border border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-100 mb-4">Match-Specific Statistics</h2>
            <p className="text-gray-300">Detailed statistics for individual matches are planned for a future update.</p>
            <p className="text-gray-400 mt-2 text-sm">This section will allow you to dive deep into individual match performances once implemented.</p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
