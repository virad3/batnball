import React from 'react';
import { UserProfile } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { UserCircleIcon, IdentificationIcon, ShieldCheckIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline'; // Example icons

interface PlayerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerUsername: string | null;
  playerProfile: UserProfile | null;
  isLoading: boolean;
  error?: string | null;
}

const DetailItem: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start space-x-2 py-2">
    {icon && <div className="flex-shrink-0 w-5 h-5 text-gray-400 mt-0.5">{icon}</div>}
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-100 font-medium">{value || 'N/A'}</p>
    </div>
  </div>
);

const PlayerInfoModal: React.FC<PlayerInfoModalProps> = ({
  isOpen,
  onClose,
  playerUsername,
  playerProfile,
  isLoading,
  error
}) => {
  if (!isOpen) {
    return null;
  }

  const displayName = playerProfile?.username || playerUsername || "Player";
  const profilePic = playerProfile?.profilePicUrl || `https://picsum.photos/seed/${displayName}/150/150`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-info-modal-content" // Changed from title to content as title is removed
    >
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 text-gray-200">
        <div className="flex justify-end items-center mb-4"> {/* Adjusted margin-bottom as title is gone */}
          {/* Title h2 removed */}
          <button
            onClick={onClose}
            aria-label="Close player information modal"
            className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="player-info-modal-content"> {/* Added id for aria-labelledby */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-300">Loading player details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <UserCircleIcon className="w-16 h-16 text-gray-500 mx-auto mb-3" />
              <p className="text-red-400">{error}</p>
              <p className="text-sm text-gray-400 mt-1">Could not load detailed profile for {playerUsername}.</p>
            </div>
          ) : playerProfile ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={profilePic}
                  alt={`${displayName}'s profile`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-600 shadow-md"
                  onError={(e) => (e.currentTarget.src = `https://picsum.photos/seed/${displayName}/150/150`)}
                />
                <p className="text-xl font-semibold text-gray-100">{playerProfile.username}</p> {/* Username displayed below image */}
              </div>

              <div className="border-t border-gray-700 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <DetailItem label="Player Role" value={playerProfile.player_role} icon={<IdentificationIcon />} />
                <DetailItem label="Profile Type" value={playerProfile.profileType} icon={<UserCircleIcon />} />
                <DetailItem label="Batting Style" value={playerProfile.batting_style} icon={<ShieldCheckIcon className="transform scale-x-[-1]" />} />
                <DetailItem label="Bowling Style" value={playerProfile.bowling_style} icon={<ShieldCheckIcon />} />
              </div>

              <div className="mt-6 p-4 bg-gray-700 rounded-md text-center border border-gray-600">
                  <PresentationChartLineIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300 font-medium">Full Stats & Current Form</p>
                  <p className="text-xs text-gray-400">Coming Soon!</p>
              </div>
              {playerProfile.id && (
                  <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { /* Implement navigation or handling */ console.log(`View full profile for ${playerProfile.id}`); onClose();}}
                      className="w-full mt-2"
                  >
                      View Full Profile (Placeholder)
                  </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <UserCircleIcon className="w-16 h-16 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-300">No detailed profile available for {playerUsername}.</p>
              <p className="text-sm text-gray-400 mt-1">This player may not be a registered user or their profile is not set up.</p>
            </div>
          )}
        </div>
        {/* Bottom close button removed */}
      </div>
    </div>
  );
};

export default PlayerInfoModal;