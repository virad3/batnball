
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const MyCricketPage: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    history.replace('/matches');
  }, [history]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-250px)] text-gray-300">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg">Loading Matches...</p>
    </div>
  );
};

export default MyCricketPage;
