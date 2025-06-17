
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const MyTeamsPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-xl text-center">
      <h1 className="text-3xl font-bold text-[#004d40] mb-6">My Teams</h1>
      <img src="https://picsum.photos/seed/myteams-placeholder/400/250" alt="Team placeholder" className="mx-auto rounded-lg mb-6 shadow-md"/>
      <p className="text-gray-700 mb-4">
        This is where you'll be able to see and manage the teams you are a part of, view team rosters, upcoming fixtures specific to your teams, and more.
      </p>
      <p className="text-gray-600 mb-6">
        This feature is currently under development. Stay tuned!
      </p>
      <div className="space-x-4">
        <Link to="/profile">
          <Button variant="outline">Back to Profile</Button>
        </Link>
        <Link to="/home">
          <Button variant="primary">Go to Homepage</Button>
        </Link>
      </div>
    </div>
  );
};

export default MyTeamsPage;
