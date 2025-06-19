
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team, MatchFormat } from '../types';
import { useMatchContext } from '../contexts/MatchContext';
import Button from '../components/Button';
import TeamSelectionModal from '../components/TeamSelectionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, PlayIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const SelectTeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { startNewMatch } = useMatchContext();
  const [selectedTeamA, setSelectedTeamA] = useState<Team | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamSelectionTarget, setTeamSelectionTarget] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setIsLoading(true);
    try {
      const partialMatchData: Partial<Team> & { teamAName: string, teamBName: string, format: MatchFormat, venue: string, overs_per_innings?: number, date: string, status: "Upcoming" } = {
        teamAName: selectedTeamA.name,
        teamBName: selectedTeamB.name,
        format: MatchFormat.T20,
        overs_per_innings: 20,
        venue: "New Match Venue",
        date: new Date().toISOString(),
        status: "Upcoming",
      };

      // @ts-ignore
      const newMatch = await startNewMatch(partialMatchData);
      if (newMatch && newMatch.id) {
        navigate(`/matches/${newMatch.id}/score`);
      } else {
        throw new Error("Failed to create a new match instance.");
      }
    } catch (err: any) {
      console.error("Error starting new match:", err);
      setError(err.message || "Could not start the match. Please try again.");
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Custom Header */}
      <header className="bg-gray-800 text-gray-100 p-4 shadow-md sticky top-0 z-10 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            aria-label="Go back" 
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Start A Match</h1>
          <button
            onClick={handleProceedToMatch}
            disabled={!selectedTeamA || !selectedTeamB || isLoading}
            aria-label="Proceed to match setup"
            className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                        ${isLoading ? 'bg-gray-600' : 'bg-red-700 hover:bg-red-600'}`}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <PlayIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-8">
        {error && <p className="text-red-300 bg-red-900 bg-opacity-50 p-3 rounded-md text-sm w-full max-w-md text-center border border-red-700">{error}</p>}
        
        <TeamDisplayButton
          team={selectedTeamA}
          onSelect={() => handleOpenModal('A')}
          placeholderText="SELECT TEAM A"
        />

        <div className="flex items-center w-full max-w-xs sm:max-w-sm">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-4 px-3 py-1.5 bg-gray-700 text-gray-200 text-sm font-semibold rounded-full border border-gray-600 transform rotate-[-0deg]">VS</span>
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
