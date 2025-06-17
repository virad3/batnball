
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview'); 

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-50">Statistics</h1>

      <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-4">
        <Button 
            variant={activeTab === 'overview' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('overview')}
            size="sm"
        >Overview</Button>
        <Button 
            variant={activeTab === 'matches' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('matches')}
            size="sm"
        >Match Stats (Coming Soon)</Button>
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