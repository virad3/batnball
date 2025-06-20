import React from 'react';
import { Link } from 'react-router-dom';
import { Tournament, TournamentStatus } from '../types';
import Button from './Button';
import { FirebaseTimestamp, Timestamp } from '../services/firebaseClient'; // Use re-exported Timestamp

interface TournamentCardProps {
  tournament: Tournament;
}

const getTournamentStatus = (startDate: Date, endDate: Date): TournamentStatus => {
  const now = new Date();
  if (now < startDate) return "Upcoming";
  if (now > endDate) return "Past";
  return "Ongoing";
};

const formatDateForCard = (dateInput: string | FirebaseTimestamp | Date | undefined | null): string => {
  if (!dateInput) return 'N/A';
  let d: Date;
  if (dateInput instanceof Timestamp) { // Use the imported Timestamp
    d = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    d = new Date(dateInput);
  } else {
    d = dateInput; 
  }

  if (isNaN(d.getTime())) return 'Invalid Date';

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const startDate = tournament.startDate instanceof Timestamp ? tournament.startDate.toDate() : new Date(tournament.startDate as string | Date);
  const endDate = tournament.endDate instanceof Timestamp ? tournament.endDate.toDate() : new Date(tournament.endDate as string | Date);
  
  const status = getTournamentStatus(startDate, endDate);

  const statusBadgeStyles: Record<TournamentStatus, string> = {
    Upcoming: "bg-blue-600 text-white", // Updated
    Ongoing: "bg-red-600 text-white",  // Consistent
    Past: "bg-gray-700 text-gray-200",   // Updated
  };

  const formattedStartDate = formatDateForCard(startDate);
  const formattedEndDate = formatDateForCard(endDate);

  const defaultBanner = `https://picsum.photos/seed/${tournament.id}/600/300`;

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block group">
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-700 group-hover:border-red-600">
        <div className="relative h-40 sm:h-48 w-full">
          <img 
              src={tournament.logoUrl || defaultBanner} 
              alt={`${tournament.name} banner`}
              className="w-full h-full object-cover" 
              onError={(e) => (e.currentTarget.src = defaultBanner)}
          />
          <span 
            className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full shadow ${statusBadgeStyles[status]}`}
          >
            {status.toUpperCase()}
          </span>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-100 mb-2 truncate" title={tournament.name}>
            {tournament.name}
          </h3>
          <p className="text-xs text-gray-400 mb-1">
            Date: {formattedStartDate} to {formattedEndDate}
          </p>
          <p className="text-xs text-gray-400 mb-3 truncate" title={tournament.location || "Location not specified"}>
            {tournament.location || "Location not specified"}
          </p>

          {status === "Ongoing" && (
            <div className="flex justify-end">
              <Button 
                variant="primary" 
                size="sm" 
                className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-3 py-1.5"
                onClick={(e) => { e.preventDefault(); console.log('Follow tournament clicked'); /* Implement follow logic */}}
              >
                FOLLOW
              </Button>
            </div>
          )}
           {(status === "Upcoming" || status === "Past") && (
             <div className="h-[29px]"></div> 
           )}
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;