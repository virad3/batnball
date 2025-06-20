
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team, MatchFormat } from '../types';
import { useMatchContext } from '../contexts/MatchContext';
import Button from '../components/Button';
import TeamSelectionModal from '../components/TeamSelectionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, PlayIcon, PlusIcon, UserGroupIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

// Helper to get current date and time in YYYY-MM-DD and HH:MM format
const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return { date, time };
};


const SelectTeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { startNewMatch } = useMatchContext();
  const [selectedTeamA, setSelectedTeamA] = useState<Team | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamSelectionTarget, setTeamSelectionTarget] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matchDate, setMatchDate] = useState(getCurrentDateTime().date);
  const [matchTime, setMatchTime] = useState(getCurrentDateTime().time);
  const [venue, setVenue] = useState('Local Ground');
  const [overs, setOvers] = useState(20);
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(MatchFormat.T20);

  const handleOpenModal = (target: 'A' | 'B') => {
    setTeamSelectionTarget(target);
    setIsModalOpen(true);
    setError(null);
  };

  const handleTeamSelected = (team: Team) => {
    if (teamSelectionTarget === 'A') {
      if (selectedTeamB?.id === team.id) {
        setError("Team A cannot be the same as Team B.");
        return;
      }
      setSelectedTeamA(team);
    } else if (teamSelectionTarget === 'B') {
      if (selectedTeamA?.id === team.id) {
        setError("Team B cannot be the same as Team A.");
        return;
      }
      setSelectedTeamB(team);
    }
    setIsModalOpen(false);
    setError(null);
  };

  const handleProceedToMatch = async () => {
    if (!selectedTeamA || !selectedTeamB) {
      setError("Please select both teams to proceed.");
      return;
    }
    if (!matchDate || !matchTime) {
        setError("Please select a valid date and time for the match.");
        return;
    }
    if (!venue.trim()) {
        setError("Please enter a venue for the match.");
        return;
    }

    const selectedDateTime = new Date(`${matchDate}T${matchTime}`);
    if (isNaN(selectedDateTime.getTime())) {
        setError("Invalid date or time selected.");
        return;
    }
    
    // Optional: Check if selectedDateTime is in the past, if scheduling past matches is not allowed
    // if (selectedDateTime < new Date()) {
    //   setError("Cannot schedule a match in the past.");
    //   return;
    // }

    setError(null);
    setIsLoading(true);
    try {
      const partialMatchData = {
        teamAName: selectedTeamA.name,
        teamBName: selectedTeamB.name,
        teamASquad: selectedTeamA.players,
        teamBSquad: selectedTeamB.players,
        format: matchFormat,
        overs_per_innings: matchFormat === MatchFormat.TEST ? undefined : overs,
        venue: venue.trim(),
        date: selectedDateTime.toISOString(), // Send as ISO string
        status: "Upcoming" as "Upcoming", // Explicitly set status
      };

      const newMatch = await startNewMatch(partialMatchData);
      if (newMatch && newMatch.id) {
        // Navigate to matches page to see the scheduled match
        navigate('/matches'); 
      } else {
        throw new Error("Failed to create a new match instance.");
      }
    } catch (err: any) {
      console.error("Error starting new match:", err);
      setError(err.message || "Could not schedule the match. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const TeamDisplayButton: React.FC<{ team: Team | null; onSelect: () => void; placeholderText: string; teamLogoPlaceholderIcon?: React.ReactNode }> = ({ team, onSelect, placeholderText, teamLogoPlaceholderIcon }) => (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={onSelect}
        className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-700 rounded-full flex items-center justify-center text-gray-100 shadow-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
        aria-label={team ? `Change ${placeholderText}`: `Select ${placeholderText}`}
      >
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={`${team.name} logo`} className="w-full h-full rounded-full object-cover" />
        ) : team ? (
          teamLogoPlaceholderIcon || <UserGroupIcon className="w-16 h-16 sm:w-20 sm:h-20 opacity-80" />
        ) : (
          <PlusIcon className="w-16 h-16 sm:w-20 sm:h-20 opacity-70" />
        )}
      </button>
      <Button
        onClick={onSelect}
        className="bg-teal-600 hover:bg-teal-500 text-white w-40 sm:w-48 py-2.5 text-sm truncate focus:ring-teal-400 focus:ring-offset-gray-900"
        aria-label={team ? `Selected team: ${team.name}` : placeholderText}
      >
        {team ? team.name : placeholderText.toUpperCase()}
      </Button>
    </div>
  );
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 text-gray-100 p-4 shadow-md sticky top-0 z-10 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Go back" 
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Schedule A Match</h1>
          <button
            onClick={handleProceedToMatch}
            disabled={!selectedTeamA || !selectedTeamB || isLoading}
            aria-label="Schedule Match"
            className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                        ${isLoading ? 'bg-gray-600' : 'bg-red-700 hover:bg-red-600'}`}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <CalendarDaysIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start p-4 space-y-6 overflow-y-auto">
        {error && <p className="text-red-300 bg-red-900 bg-opacity-50 p-3 rounded-md text-sm w-full max-w-md text-center border border-red-700 mt-2">{error}</p>}
        
        <div className="w-full max-w-md bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-700">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="matchDate" className={labelClass}>Date</label>
                    <input type="date" id="matchDate" value={matchDate} onChange={e => setMatchDate(e.target.value)} className={`${inputClass} dark-date-picker`} required/>
                </div>
                <div>
                    <label htmlFor="matchTime" className={labelClass}>Time</label>
                    <input type="time" id="matchTime" value={matchTime} onChange={e => setMatchTime(e.target.value)} className={`${inputClass} dark-time-picker`} required/>
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="venue" className={labelClass}>Venue</label>
                <input type="text" id="venue" value={venue} onChange={e => setVenue(e.target.value)} className={inputClass} placeholder="e.g., City Ground" required/>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="matchFormat" className={labelClass}>Format</label>
                    <select id="matchFormat" value={matchFormat} onChange={e => setMatchFormat(e.target.value as MatchFormat)} className={inputClass}>
                        {Object.values(MatchFormat).map(f => <option key={f} value={f} className="bg-gray-700">{f}</option>)}
                    </select>
                </div>
                {matchFormat !== MatchFormat.TEST && (
                    <div>
                        <label htmlFor="overs" className={labelClass}>Overs</label>
                        <input type="number" id="overs" value={overs} onChange={e => setOvers(parseInt(e.target.value, 10) || 0)} min="1" className={inputClass} />
                    </div>
                )}
            </div>
            <style>{`
                .dark-date-picker::-webkit-calendar-picker-indicator,
                .dark-time-picker::-webkit-calendar-picker-indicator {
                    filter: invert(1) brightness(0.8);
                }
            `}</style>
        </div>

        <TeamDisplayButton
          team={selectedTeamA}
          onSelect={() => handleOpenModal('A')}
          placeholderText="SELECT TEAM A"
        />

        <div className="flex items-center w-full max-w-xs sm:max-w-sm">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-4 px-3 py-1.5 bg-gray-700 text-gray-200 text-sm font-semibold rounded-full border border-gray-600">VS</span>
          <hr className="flex-grow border-gray-600" />
        </div>
        
        <TeamDisplayButton
          team={selectedTeamB}
          onSelect={() => handleOpenModal('B')}
          placeholderText="SELECT TEAM B"
        />
      </main>

      {isModalOpen && teamSelectionTarget && (
        <TeamSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTeamSelected={handleTeamSelected}
          currentSelectionTarget={teamSelectionTarget}
          existingTeamAId={selectedTeamA?.id}
          existingTeamBId={selectedTeamB?.id}
        />
      )}
    </div>
  );
};

export default SelectTeamsPage;
