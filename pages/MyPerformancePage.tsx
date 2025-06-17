
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const MyPerformancePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-xl text-center">
      <h1 className="text-3xl font-bold text-[#004d40] mb-6">My Performance</h1>
      <img src="https://picsum.photos/seed/myperformance-placeholder/400/250" alt="Performance placeholder" className="mx-auto rounded-lg mb-6 shadow-md"/>

      <p className="text-gray-700 mb-4">
        Dive deep into your personal cricket statistics! Track your batting average, strike rate, bowling economy, wickets taken, and see your progress over time.
      </p>
      <p className="text-gray-600 mb-6">
        Detailed performance analytics and career graphs are coming soon.
      </p>
      <div className="space-x-4">
        <Link to="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
        <Link to="/stats">
          <Button variant="primary">View General Stats</Button>
        </Link>
      </div>
    </div>
  );
};

export default MyPerformancePage;
