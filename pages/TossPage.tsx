
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoinTossModal from '../components/CoinTossModal';
import LoadingSpinner from '../components/LoadingSpinner'; // Optional: if initial page state needs loading

const TossPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Open the modal as soon as the page loads
    setIsModalOpen(true);
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Navigate back to home or previous page when modal is simply closed
    navigate('/home'); 
  };

  const handleProceedToMatch = () => {
    setIsModalOpen(false);
    // Navigate to the match setup page
    navigate('/start-match/select-teams');
  };

  // The page itself can be minimal, primarily for controlling the modal
  // and providing a full-page context if needed for styling or future elements.
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {/* 
        This div acts as a backdrop for the modal if needed, 
        or can contain other UI elements for the /toss page itself in the future.
        For now, it's mostly a container to trigger the modal.
      */}
      <CoinTossModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onProceed={handleProceedToMatch}
      />
      {!isModalOpen && (
         <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-300 mt-4">Loading Toss...</p>
         </div>
      )}
    </div>
  );
};

export default TossPage;
