
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Team, MatchFormat, UserProfile } from '../types';
import { useMatchContext } from '../contexts/MatchContext';
import Button from '../components/Button';
import TeamSelectionModal from '../components/TeamSelectionModal';
import EditMatchSquadModal from '../components/EditMatchSquadModal'; // New Import
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, PlayIcon, PlusIcon, UserGroupIcon, CalendarDaysIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { getAllUserProfilesForSuggestions } from '../services/dataService'; // New Import

const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return { date, time };
};

const DEFAULT_OVERS = 20;
const SQUAD_LIMIT = 11;

const SelectTeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startNewMatch } = useMatchContext(); 
  
  const isStartNowMode = location.state?.mode === 'startNow';

  const [selectedTeamA, setSelectedTeamA] = useState<Team | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<Team | null>(null);
  const [isTeamSelectionModalOpen, setIsTeamSelectionModalOpen] = useState(false);
  const [teamSelectionTarget, setTeamSelectionTarget] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For scheduling mode
  const [matchDate, setMatchDate] = useState(getCurrentDateTime().date);
  const [matchTime, setMatchTime] = useState(getCurrentDateTime().time);
  const [venue, setVenue] = useState('Local Ground');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(MatchFormat.T20);
  
  // For 'startNow' mode squad and overs configuration
  const [matchOvers, setMatchOvers] = useState(DEFAULT_OVERS);
  const [confirmedTeamASquad, setConfirmedTeamASquad] = useState<string[]>([]);
  const [confirmedTeamBSquad, setConfirmedTeamBSquad] = useState<string[]>([]);
  const [isEditSquadModalOpen, setIsEditSquadModalOpen] = useState(false);
  const [editingSquadForTeam, setEditingSquadForTeam] = useState<'A' | 'B' | null>(null);
  const [allKnownPlayers, setAllKnownPlayers] = useState<Pick<UserProfile, 'id' | 'username'>[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setPageLoading(true);
      try {
        const players = await getAllUserProfilesForSuggestions();
        setAllKnownPlayers(players);
      } catch (err) {
        console.error("Failed to load player suggestions:", err);
        setError("Could not load player list for squad suggestions.");
      } finally {
        setPageLoading(false);
      }
    };
    if(isStartNowMode) fetchPlayers();
    else setPageLoading(false);
  }, [isStartNowMode]);


  const handleOpenTeamSelectionModal = (target: 'A' | 'B') => {
    setTeamSelectionTarget(target);
    setIsTeamSelectionModalOpen(true);
    setError(null);
  };

  const handleTeamSelected = (team: Team) => {
    setError(null);
    if (teamSelectionTarget === 'A') {
      if (selectedTeamB?.id === team.id) {
        setError("Team A cannot be the same as Team B.");
        return;
      }
      setSelectedTeamA(team);
      setConfirmedTeamASquad(team.players.slice(0, SQUAD_LIMIT)); // Initialize with team's players up to limit
    } else if (teamSelectionTarget === 'B') {
      if (selectedTeamA?.id === team.id) {
        setError("Team B cannot be the same as Team A.");
        return;
      }
      setSelectedTeamB(team);
      setConfirmedTeamBSquad(team.players.slice(0, SQUAD_LIMIT)); // Initialize
    }
    setIsTeamSelectionModalOpen(false);
  };

  const handleOpenEditSquadModal = (target: 'A' | 'B') => {
    setEditingSquadForTeam(target);
    setIsEditSquadModalOpen(true);
  };

  const handleConfirmSquad = (finalSquad: string[]) => {
    if (editingSquadForTeam === 'A') {
      setConfirmedTeamASquad(finalSquad);
    } else if (editingSquadForTeam === 'B') {
      setConfirmedTeamBSquad(finalSquad);
    }
    setIsEditSquadModalOpen(false);
    setEditingSquadForTeam(null);
  };

  const canProceed = () => {
    if (!selectedTeamA || !selectedTeamB) return false;
    if (isStartNowMode) {
      return (
        matchOvers > 0 &&
        confirmedTeamASquad.length === SQUAD_LIMIT &&
        confirmedTeamBSquad.length === SQUAD_LIMIT
      );
    }
    return true; // For scheduling, only teams are mandatory at this stage
  };


  const handleProceed = async () => {
    if (!selectedTeamA || !selectedTeamB) {
      setError("Please select both teams to proceed.");
      return;
    }
    setError(null);
    setIsLoading(true);

    if (isStartNowMode) {
      if (matchOvers <= 0) {
        setError("Number of overs must be greater than 0.");
        setIsLoading(false);
        return;
      }
      if (confirmedTeamASquad.length !== SQUAD_LIMIT || confirmedTeamBSquad.length !== SQUAD_LIMIT) {
        setError(`Both teams must have exactly ${SQUAD_LIMIT} players in their match squad.`);
        setIsLoading(false);
        return;
      }
      
      const matchSettingsForToss = {
        venue: "Local Ground", // Default for startNow
        format: MatchFormat.T20, // Default for startNow
        overs_per_innings: matchOvers,
        date: new Date().toISOString(), 
      };
      navigate('/toss', { 
        state: { 
          teamAName: selectedTeamA.name, 
          teamBName: selectedTeamB.name, 
          teamASquad: confirmedTeamASquad,
          teamBSquad: confirmedTeamBSquad,
          matchSettings: matchSettingsForToss,
          mode: 'startNow',
        } 
      });
      setIsLoading(false);
    } else {
      // Scheduling flow
      if (!matchDate || !matchTime) {
          setError("Please select a valid date and time for the match.");
          setIsLoading(false);
          return;
      }
      if (!venue.trim()) {
          setError("Please enter a venue for the match.");
          setIsLoading(false);
          return;
      }
      const selectedDateTime = new Date(`${matchDate}T${matchTime}`);
      if (isNaN(selectedDateTime.getTime())) {
          setError("Invalid date or time selected.");
          setIsLoading(false);
          return;
      }
      
      try {
        const partialMatchData = {
          teamAName: selectedTeamA.name,
          teamBName: selectedTeamB.name,
          teamASquad: selectedTeamA.players, // Uses team's default players for scheduling
          teamBSquad: selectedTeamB.players, // Uses team's default players for scheduling
          format: matchFormat,
          overs_per_innings: matchFormat === MatchFormat.TEST ? undefined : matchOvers, // Use matchOvers for custom here too
          venue: venue.trim(),
          date: selectedDateTime.toISOString(), 
          status: "Upcoming" as "Upcoming", 
        };
        const newMatch = await startNewMatch(partialMatchData);
        if (newMatch && newMatch.id) {
          navigate('/matches'); 
        } else {
          throw new Error("Failed to create a new match instance for scheduling.");
        }
      } catch (err: any) {
        console.error("Error scheduling match:", err);
        setError(err.message || "Could not schedule the match. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const TeamDisplayButton: React.FC<{ team: Team | null; onSelect: () => void; placeholderText: string; }> = ({ team, onSelect, placeholderText }) => (
    <div className="flex flex-col items-center space-y-3">
      <button
        onClick={onSelect}
        className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-700 rounded-full flex items-center justify-center text-gray-100 shadow-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
        aria-label={team ? `Change ${placeholderText}`: `Select ${placeholderText}`}
      >
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={`${team.name} logo`} className="w-full h-full rounded-full object-cover" />
        ) : team ? (
          <UserGroupIcon className="w-16 h-16 sm:w-20 sm:h-20 opacity-80" />
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
  const inputFocusClass = "focus:ring-teal-500 focus:border-teal-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";
  
  const pageTitle = isStartNowMode ? "Start New Match" : "Schedule A Match";
  const proceedButtonText = isStartNowMode ? "Proceed to Toss" : "Schedule Match";
  const proceedButtonIcon = isStartNowMode ? <PlayIcon className="w-6 h-6" /> : <CalendarDaysIcon className="w-6 h-6" />;

  const handleBackNavigation = () => {
    navigate(-1); // Simplified back navigation
  };

  if (pageLoading && isStartNowMode) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 mt-4">Loading player data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-800 text-gray-100 p-4 shadow-md sticky top-0 z-10 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={handleBackNavigation} 
            aria-label="Go back" 
            className="p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
          <button
            onClick={handleProceed}
            disabled={!canProceed() || isLoading}
            aria-label={proceedButtonText}
            className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                        ${isLoading ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-500'}`}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : proceedButtonIcon}
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start p-4 space-y-6 overflow-y-auto">
        {error && <p className="text-red-300 bg-red-900 bg-opacity-50 p-3 rounded-md text-sm w-full max-w-lg text-center border border-red-700 mt-2">{error}</p>}
        
        {/* Match Details Section - Conditional Display */}
        {!isStartNowMode && (
            <div className="w-full max-w-lg bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-3">Match Settings</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="matchDate" className={labelClass}>Date</label>
                        <input type="date" id="matchDate" value={matchDate} onChange={e => setMatchDate(e.target.value)} className={`${inputClass} dark-date-picker`} required/>
                    </div>
                    <div>
                        <label htmlFor="matchTime" className={labelClass}>Time</label>
                        <input type="time" id="matchTime" value={matchTime} onChange={e => setMatchTime(e.target.value)} className={`${inputClass} dark-time-picker`} required/>
                    </div>
                </div>
                <div>
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
                            <input type="number" id="overs" value={matchOvers} onChange={e => setMatchOvers(parseInt(e.target.value, 10) || 0)} min="1" className={inputClass} />
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
        )}
        
        {/* Team Selection Area */}
        <div className="flex flex-col sm:flex-row items-center justify-around w-full max-w-3xl space-y-6 sm:space-y-0 sm:space-x-4">
          <TeamDisplayButton
            team={selectedTeamA}
            onSelect={() => handleOpenTeamSelectionModal('A')}
            placeholderText="SELECT TEAM A"
          />
          <div className="text-2xl font-bold text-gray-500 hidden sm:block">VS</div>
          <TeamDisplayButton
            team={selectedTeamB}
            onSelect={() => handleOpenTeamSelectionModal('B')}
            placeholderText="SELECT TEAM B"
          />
        </div>

        {/* Squad and Overs Configuration for 'startNow' mode */}
        {isStartNowMode && selectedTeamA && selectedTeamB && (
          <div className="w-full max-w-lg bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-700 space-y-4">
            <div>
              <label htmlFor="matchOvers" className={labelClass}>Number of Overs:</label>
              <input 
                type="number" 
                id="matchOvers" 
                value={matchOvers} 
                onChange={e => setMatchOvers(parseInt(e.target.value, 10) || 1)} 
                min="1" 
                className={inputClass} 
              />
            </div>
            
            <div className="space-y-3">
              {[
                { team: selectedTeamA, squad: confirmedTeamASquad, onEdit: () => handleOpenEditSquadModal('A'), label: "Team A Squad" },
                { team: selectedTeamB, squad: confirmedTeamBSquad, onEdit: () => handleOpenEditSquadModal('B'), label: "Team B Squad" }
              ].map(item => (
                item.team && (
                  <div key={item.team.id} className="p-3 bg-gray-700 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-md font-semibold text-gray-200">{item.label} ({item.squad.length}/{SQUAD_LIMIT})</h4>
                      <Button onClick={item.onEdit} variant="outline" size="sm" leftIcon={<PencilSquareIcon className="w-4 h-4"/>}>Edit</Button>
                    </div>
                    <ul className="text-xs text-gray-300 list-disc list-inside">
                      {item.squad.slice(0, 5).map(p => <li key={p} className="truncate">{p}</li>)}
                      {item.squad.length > 5 && <li>...and {item.squad.length - 5} more</li>}
                    </ul>
                     {item.squad.length !== SQUAD_LIMIT && <p className="text-xs text-yellow-400 mt-1">Squad must have {SQUAD_LIMIT} players.</p>}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </main>

      {isTeamSelectionModalOpen && teamSelectionTarget && (
        <TeamSelectionModal
          isOpen={isTeamSelectionModalOpen}
          onClose={() => setIsTeamSelectionModalOpen(false)}
          onTeamSelected={handleTeamSelected}
          currentSelectionTarget={teamSelectionTarget}
          existingTeamAId={selectedTeamA?.id}
          existingTeamBId={selectedTeamB?.id}
        />
      )}

      {isEditSquadModalOpen && editingSquadForTeam && (
        <EditMatchSquadModal
          isOpen={isEditSquadModalOpen}
          onClose={() => setIsEditSquadModalOpen(false)}
          teamName={editingSquadForTeam === 'A' ? selectedTeamA?.name || 'Team A' : selectedTeamB?.name || 'Team B'}
          initialSquad={editingSquadForTeam === 'A' ? confirmedTeamASquad : confirmedTeamBSquad}
          allKnownPlayers={allKnownPlayers}
          onConfirmSquad={handleConfirmSquad}
        />
      )}
    </div>
  );
};

export default SelectTeamsPage;
