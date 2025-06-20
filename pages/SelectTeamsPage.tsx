

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Team, MatchFormat, UserProfile, Match } from '../types';
import { useMatchContext } from '../contexts/MatchContext';
import Button from '../components/Button';
import TeamSelectionModal from '../components/TeamSelectionModal';
import EditMatchSquadModal from '../components/EditMatchSquadModal'; // New Import
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeftIcon, PlayIcon, PlusIcon, UserGroupIcon, CalendarDaysIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/solid';
import { getAllUserProfilesForSuggestions, createMatch, getMatchById, updateMatch } from '../services/dataService'; // Direct service calls
import { Timestamp } from '../services/firebaseClient';


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
  const { matchId: paramMatchId } = useParams<{ matchId?: string }>(); // For edit mode
  // const { loadMatch } = useMatchContext(); // For fetching existing match to edit // Not needed if using dataService directly

  const isStartNowMode = location.state?.mode === 'startNow' && !paramMatchId;
  const isEditMode = !!paramMatchId;

  const [selectedTeamA, setSelectedTeamA] = useState<Team | null>(null);
  const [selectedTeamB, setSelectedTeamB] = useState<Team | null>(null);
  const [teamANameInput, setTeamANameInput] = useState(''); 
  const [teamBNameInput, setTeamBNameInput] = useState(''); 

  const [isTeamSelectionModalOpen, setIsTeamSelectionModalOpen] = useState(false);
  const [teamSelectionTarget, setTeamSelectionTarget] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For scheduling/editing mode
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
    const fetchInitialData = async () => {
      setPageLoading(true);
      try {
        // Fetch players if starting now OR editing (for squad suggestions)
        if (isStartNowMode || isEditMode) { 
          const players = await getAllUserProfilesForSuggestions();
          setAllKnownPlayers(players);
        }
        if (isEditMode && paramMatchId) {
          const existingMatch = await getMatchById(paramMatchId);
          if (existingMatch) {
            setTeamANameInput(existingMatch.teamAName);
            setTeamBNameInput(existingMatch.teamBName);
            setVenue(existingMatch.venue);
            setMatchFormat(existingMatch.format);
            setMatchOvers(existingMatch.overs_per_innings ?? DEFAULT_OVERS);
            if (existingMatch.date) {
                let d: Date;
                if (existingMatch.date instanceof Timestamp) {
                    d = existingMatch.date.toDate();
                } else {
                    d = new Date(existingMatch.date as string);
                }
                if (!isNaN(d.getTime())) {
                    setMatchDate(d.toISOString().split('T')[0]);
                    setMatchTime(d.toTimeString().split(' ')[0].substring(0, 5));
                }
            }
            setConfirmedTeamASquad(existingMatch.teamASquad?.slice(0, SQUAD_LIMIT) || []);
            setConfirmedTeamBSquad(existingMatch.teamBSquad?.slice(0, SQUAD_LIMIT) || []);

          } else {
            setError("Match to edit not found.");
            navigate('/matches', {replace: true});
          }
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Could not load necessary data. " + (err as Error).message);
      } finally {
        setPageLoading(false);
      }
    };
    fetchInitialData();
  }, [isStartNowMode, isEditMode, paramMatchId, navigate]);


  const handleOpenTeamSelectionModal = (target: 'A' | 'B') => {
    setTeamSelectionTarget(target);
    setIsTeamSelectionModalOpen(true);
    setError(null);
  };

  const handleTeamSelected = (team: Team) => {
    setError(null);
    if (teamSelectionTarget === 'A') {
      if ((selectedTeamB?.id && selectedTeamB.id === team.id) || teamBNameInput === team.name) {
        setError("Team A cannot be the same as Team B.");
        return;
      }
      setSelectedTeamA(team);
      setTeamANameInput(team.name);
      setConfirmedTeamASquad(team.players.slice(0, SQUAD_LIMIT)); 
    } else if (teamSelectionTarget === 'B') {
      if ((selectedTeamA?.id && selectedTeamA.id === team.id) || teamANameInput === team.name) {
        setError("Team B cannot be the same as Team A.");
        return;
      }
      setSelectedTeamB(team);
      setTeamBNameInput(team.name);
      setConfirmedTeamBSquad(team.players.slice(0, SQUAD_LIMIT));
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
    if (!teamANameInput.trim() || !teamBNameInput.trim()) return false;
    if (isStartNowMode) {
      return (
        matchOvers > 0 &&
        confirmedTeamASquad.length === SQUAD_LIMIT &&
        confirmedTeamBSquad.length === SQUAD_LIMIT
      );
    }
    // For scheduling or editing, basic details are needed.
    return !!(matchDate && matchTime && venue.trim() && teamANameInput.trim() && teamBNameInput.trim());
  };


  const handleProceed = async () => {
    if (!teamANameInput.trim() || !teamBNameInput.trim()) {
      setError("Please select or enter names for both teams.");
      return;
    }
    if (teamANameInput.trim().toLowerCase() === teamBNameInput.trim().toLowerCase()){
      setError("Team A and Team B names cannot be the same.");
      return;
    }

    setError(null);
    setIsLoading(true);

    if (isStartNowMode) {
      if (matchOvers <= 0 && matchFormat !== MatchFormat.TEST) {
        setError("Number of overs must be greater than 0 for this format.");
        setIsLoading(false);
        return;
      }
      if (confirmedTeamASquad.length !== SQUAD_LIMIT || confirmedTeamBSquad.length !== SQUAD_LIMIT) {
        setError(`Both teams must have exactly ${SQUAD_LIMIT} players in their match squad for 'Start Now'.`);
        setIsLoading(false);
        return;
      }
      
      const matchSettingsForToss = {
        venue: venue || "Local Ground", 
        format: matchFormat,
        overs_per_innings: matchFormat === MatchFormat.TEST ? undefined : matchOvers,
        date: new Date().toISOString(), 
      };
      navigate('/toss', { 
        state: { 
          teamAName: teamANameInput.trim(), 
          teamBName: teamBNameInput.trim(), 
          teamASquad: confirmedTeamASquad,
          teamBSquad: confirmedTeamBSquad,
          matchSettings: matchSettingsForToss,
          mode: 'startNow', // Ensure 'mode' is explicitly passed
        } 
      });
      setIsLoading(false);
    } else { 
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
      
      const matchDataToSave: Partial<Match> = {
        teamAName: teamANameInput.trim(),
        teamBName: teamBNameInput.trim(),
        teamASquad: confirmedTeamASquad.length >= SQUAD_LIMIT ? confirmedTeamASquad : (selectedTeamA?.players.slice(0, SQUAD_LIMIT) || []),
        teamBSquad: confirmedTeamBSquad.length >= SQUAD_LIMIT ? confirmedTeamBSquad : (selectedTeamB?.players.slice(0, SQUAD_LIMIT) || []),
        format: matchFormat,
        overs_per_innings: matchFormat === MatchFormat.TEST ? undefined : matchOvers,
        venue: venue.trim(),
        date: selectedDateTime.toISOString(), // Will be converted to Timestamp by dataService
      };

      try {
        if (isEditMode && paramMatchId) {
          matchDataToSave.status = "Upcoming"; 
          await updateMatch(paramMatchId, matchDataToSave);
          navigate('/matches', { replace: true });
        } else {
          matchDataToSave.status = "Upcoming";
          const newMatch = await createMatch(matchDataToSave);
          if (newMatch && newMatch.id) {
            navigate('/matches', { replace: true });
          } else {
            throw new Error("Failed to create a new match instance for scheduling.");
          }
        }
      } catch (err: any) {
        console.error("Error saving match:", err);
        setError(err.message || "Could not save the match. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const TeamDisplayButton: React.FC<{ team: Team | null, teamNameDisplay: string; onSelect: () => void; onEditSquad?: () => void; squadStatus?: string; isSquadConfigurable: boolean; placeholderText: string; teamIdentifier: 'A' | 'B'; }> = 
    ({ team, teamNameDisplay, onSelect, onEditSquad, squadStatus, isSquadConfigurable, placeholderText, teamIdentifier }) => (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={onSelect}
        className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-700 rounded-full flex items-center justify-center text-gray-100 shadow-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
        aria-label={teamNameDisplay ? `Team: ${teamNameDisplay}` : `Select ${placeholderText}`}
      >
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={`${teamNameDisplay} logo`} className="w-full h-full rounded-full object-cover" />
        ) : teamNameDisplay ? (
          <UserGroupIcon className="w-16 h-16 sm:w-20 sm:h-20 opacity-80" />
        ) : (
          <PlusIcon className="w-16 h-16 sm:w-20 sm:h-20 opacity-70" />
        )}
      </button>
      <input 
        type="text"
        value={teamNameDisplay}
        onChange={(e) => {
            if (teamIdentifier === 'A') setTeamANameInput(e.target.value);
            else setTeamBNameInput(e.target.value);
        }}
        placeholder={placeholderText}
        className={`${inputClass} w-40 sm:w-48 text-center mt-1 py-2 text-sm truncate`}
        aria-label={`Name for ${placeholderText}`}
        // Removed onClick={onSelect} from input to avoid immediate modal reopening after typing.
      />
      {isSquadConfigurable && teamNameDisplay && onEditSquad && (
        <div className="text-center w-40 sm:w-48">
          <Button onClick={onEditSquad} variant="outline" size="sm" className="w-full mt-1 text-xs" leftIcon={<PencilSquareIcon className="w-3 h-3"/>}>
            Squad ({squadStatus})
          </Button>
        </div>
      )}
    </div>
  );
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-teal-500 focus:border-teal-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";
  
  const pageTitle = isEditMode ? "Edit Match Details" : (isStartNowMode ? "Start New Match" : "Schedule Match");
  const proceedButtonText = isEditMode ? "Update Match" : (isStartNowMode ? "Proceed to Toss" : "Schedule Match");
  const proceedButtonIcon = isEditMode ? <CheckIcon className="w-6 h-6" /> : (isStartNowMode ? <PlayIcon className="w-6 h-6" /> : <CalendarDaysIcon className="w-6 h-6" />);

  const handleBackNavigation = () => {
    // If coming from a specific flow (like tournament), navigate back there, otherwise to general matches.
    if (location.state?.fromTournament) {
      navigate(`/tournaments/${location.state.fromTournament}`);
    } else if (isEditMode) {
      navigate('/matches', {replace: true});
    } else {
      navigate(-1); // Default back navigation
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 mt-4">Loading match setup...</p>
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
        
        {/* Match Details Section - Not for 'startNow' mode */}
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
        <div className="flex flex-col sm:flex-row items-start justify-around w-full max-w-3xl space-y-6 sm:space-y-0 sm:space-x-4 mt-4">
          <TeamDisplayButton
            team={selectedTeamA}
            teamNameDisplay={teamANameInput}
            onSelect={() => handleOpenTeamSelectionModal('A')}
            onEditSquad={isStartNowMode || isEditMode ? () => handleOpenEditSquadModal('A') : undefined}
            squadStatus={`${confirmedTeamASquad.length}/${SQUAD_LIMIT}`}
            isSquadConfigurable={isStartNowMode || isEditMode}
            placeholderText="Team A Name"
            teamIdentifier="A"
          />
          <div className="text-2xl font-bold text-gray-500 hidden sm:block pt-16">VS</div>
          <TeamDisplayButton
            team={selectedTeamB}
            teamNameDisplay={teamBNameInput}
            onSelect={() => handleOpenTeamSelectionModal('B')}
            onEditSquad={isStartNowMode || isEditMode ? () => handleOpenEditSquadModal('B') : undefined}
            squadStatus={`${confirmedTeamBSquad.length}/${SQUAD_LIMIT}`}
            isSquadConfigurable={isStartNowMode || isEditMode}
            placeholderText="Team B Name"
            teamIdentifier="B"
          />
        </div>

        {/* Overs Configuration for 'startNow' mode IF NOT ALREADY HANDLED ABOVE */}
        {isStartNowMode && matchFormat !== MatchFormat.TEST && (
          <div className="w-full max-w-lg bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-700 space-y-4 mt-6">
            <div>
              <label htmlFor="matchOversStartNow" className={labelClass}>Number of Overs:</label>
              <input 
                type="number" 
                id="matchOversStartNow" 
                value={matchOvers} 
                onChange={e => setMatchOvers(parseInt(e.target.value, 10) || 1)} 
                min="1" 
                className={inputClass} 
              />
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
          teamName={editingSquadForTeam === 'A' ? teamANameInput || 'Team A' : teamBNameInput || 'Team B'}
          initialSquad={editingSquadForTeam === 'A' ? confirmedTeamASquad : confirmedTeamBSquad}
          allKnownPlayers={allKnownPlayers}
          onConfirmSquad={handleConfirmSquad}
        />
      )}
    </div>
  );
};

export default SelectTeamsPage;