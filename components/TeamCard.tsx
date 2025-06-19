import React from 'react';
import { MapPinIcon, QrCodeIcon as QrCodeIconOutline } from '@heroicons/react/24/outline'; // Changed LocationMarkerIcon to MapPinIcon
import { UserCircleIcon } from '@heroicons/react/24/solid'; // Solid for captain icon potentially

interface TeamCardProps {
  logoUrl?: string | null;
  teamName: string;
  location?: string;
  ownerName?: string;
  isOwnerByCurrentUser?: boolean;
  onTeamClick: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
  logoUrl, 
  teamName, 
  location = "Location N/A", 
  ownerName = "N/A", 
  isOwnerByCurrentUser = false,
  onTeamClick
}) => {
  const defaultLogoPlaceholder = (
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 flex items-center justify-center rounded-lg">
      <UserGroupIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
    </div>
  );
  
  // Simple "C" icon for captain/owner for now
  const CaptainIcon: React.FC = () => (
    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-gray-200 bg-gray-600 rounded-full border border-gray-500 mr-1.5">
      C
    </span>
  );


  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-red-700 border border-gray-700 cursor-pointer"
      onClick={onTeamClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTeamClick(); }}
      aria-label={`View details for team ${teamName}`}
    >
      <div className="p-4 flex items-center space-x-3 sm:space-x-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${teamName} logo`} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-600" 
              onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails, could show placeholder
            />
          ) : (
            defaultLogoPlaceholder
          )}
        </div>

        {/* Team Info */}
        <div className="flex-grow min-w-0"> {/* min-w-0 for truncate to work */}
          <div className="flex items-center mb-0.5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-100 truncate" title={teamName}>
              {teamName}
            </h3>
            {isOwnerByCurrentUser && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-700 text-green-100 rounded-full border border-green-600">
                Owner
              </span>
            )}
          </div>
          
          {location && location !== "Location N/A" && (
            <div className="flex items-center text-xs sm:text-sm text-gray-400 mb-0.5">
              <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" /> {/* Changed LocationMarkerIcon to MapPinIcon */}
              <span className="truncate">{location}</span>
            </div>
          )}

          <div className="flex items-center text-xs sm:text-sm text-gray-400">
            <CaptainIcon />
            <span className="truncate" title={`Captain/Owner: ${ownerName}`}>{ownerName}</span>
          </div>
        </div>

        {/* QR Code Icon */}
        <div className="flex-shrink-0 ml-auto">
          <QrCodeIconOutline className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500 hover:text-red-600 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// Minimal UserGroupIcon for placeholder
const UserGroupIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-1.5a3 3 0 00-3.741 1.5M15 11.25a3 3 0 11-6 0 3 3 0 016 0zm-3 0V3M3.293 16.293A12.062 12.062 0 011.5 12a3 3 0 116 0c0 3.032-2.18 5.5-5.207 6.293z" />
  </svg>
);


export default TeamCard;