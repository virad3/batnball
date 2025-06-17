import React from 'react';

const MyPerformancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-50">My Performance</h1>
      <div className="bg-gray-800 shadow-lg rounded-lg p-6 text-center border border-gray-700">
        <h2 className="text-2xl font-semibold text-gray-100 mb-4">Player Performance Analytics</h2>
        <img src="https://picsum.photos/seed/myperformance-placeholder/400/250" alt="Performance placeholder" className="mx-auto rounded-lg mb-6 shadow-md border border-gray-700"/>
        <p className="text-gray-300">
          This section is currently under development.
        </p>
        <p className="text-gray-400 mt-2 text-sm">
          Detailed personal performance statistics, batting and bowling insights, and career tracking will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default MyPerformancePage;