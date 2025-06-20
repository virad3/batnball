
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const MyCricketPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/matches', { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-250px)] text-gray-300">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg">Loading Matches...</p>
    </div>
  );
};

export default MyCricketPage;
