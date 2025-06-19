
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team, MatchFormat } from '../types';
import { useMatchContext } from '../contexts/MatchContext';
import Button from '../components/Button'; // Assuming Button component exists
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
      // Basic match data
      const partialMatchData: Partial<Team> & { teamAName: string, teamBName: string, format: MatchFormat, venue: string, overs_per_innings?: number, date: string, status: "Upcoming" } = {
        teamAName: selectedTeamA.name,
        teamBName: selectedTeamB.name,
        format: MatchFormat.T20, // Default to T20
        overs_per_innings: 20, // Default for T20
        venue: "New Match Venue", // Default venue
        date: new Date().toISOString(),
        status: "Upcoming",
        // teamASquad and teamBSquad will be initialized in MatchContext or handled by ScoringPage prompts
      };

      // @ts-ignore - startNewMatch expects Partial<Match> which Team + custom props satisfy for this stage
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
        className="w-32 h-32 sm:w-36 sm:h-36 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500"
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
        variant="primary"
        className="bg-teal-500 hover:bg-teal-600 text-white w-40 sm:w-48 py-2.5 text-sm font-semibold truncate"
        aria-label={team ? `Selected team: ${team.name}` : placeholderText}
      >
        {team ? team.name : placeholderText.toUpperCase()}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Custom Header */}
      <header className="bg-rose-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-full hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-white">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Start A Match</h1>
          <button
            onClick={handleProceedToMatch}
            disabled={!selectedTeamA || !selectedTeamB || isLoading}
            aria-label="Proceed to match setup"
            className="p-2 rounded-full hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <PlayIcon className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-8">
        {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm w-full max-w-md text-center">{error}</p>}
        
        <TeamDisplayButton
          team={selectedTeamA}
          onSelect={() => handleOpenModal('A')}
          placeholderText="SELECT TEAM A"
        />

        <div className="flex items-center w-full max-w-xs sm:max-w-sm">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 px-3 py-1.5 bg-gray-200 text-gray-600 text-sm font-semibold rounded-full border border-gray-300 transform rotate-[-0deg]">VS</span>
          <hr className="flex-grow border-gray-300" />
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
