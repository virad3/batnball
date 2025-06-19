
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const MyCricketPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the /matches page immediately.
    // 'replace: true' ensures that /my-cricket is not in the history stack,
    // so pressing back will not go back to /my-cricket.
    navigate('/matches', { replace: true });
  }, [navigate]);

  // Optionally, display a loading indicator while the redirect happens.
  // This content will be visible for a very short time.
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-250px)] text-gray-300">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-lg">Loading Matches...</p>
    </div>
  );
};

export default MyCricketPage;
