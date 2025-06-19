
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Team, UserProfile } from '../types';
import { getTeamById, updateTeam, getAllUserProfilesForSuggestions } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import { ArrowLeftIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

type PlayerSuggestion = Pick<UserProfile, 'id' | 'username'>;

const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [allUserProfiles, setAllUserProfiles] = useState<PlayerSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const fetchTeamDetailsAndProfiles = useCallback(async () => {
    if (!teamId) {
      setError("Team ID is missing.");
      setLoading(false);
      navigate('/my-teams');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [fetchedTeam, profiles] = await Promise.all([
        getTeamById(teamId),
        getAllUserProfilesForSuggestions()
      ]);

      if (fetchedTeam) {
        setTeam(fetchedTeam);
      } else {
        setError("Team not found or you don't have access.");
      }
      setAllUserProfiles(profiles);

    } catch (err: any) {
      console.error("Failed to fetch team details or profiles:", err);
      setError(err.message || "Could not load team details or player suggestions.");
    } finally {
      setLoading(false);
    }
  }, [teamId, navigate]);

  useEffect(() => {
    fetchTeamDetailsAndProfiles();
  }, [fetchTeamDetailsAndProfiles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPlayerName(value);
    setError(null);

    if (value.trim() && allUserProfiles.length > 0 && team) {
      const filtered = allUserProfiles.filter(profile =>
        profile.username.toLowerCase().includes(value.toLowerCase()) && !team.players.includes(profile.username)
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestedPlayer: PlayerSuggestion) => {
    setNewPlayerName(suggestedPlayer.username);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleAddPlayer = async () => {
    const nameToAdd = newPlayerName.trim();
    if (!team || !nameToAdd) {
      setError("Player name cannot be empty.");
      setShowSuggestions(false);
      return;
    }
    if (team.players.includes(nameToAdd)) {
      setError("This player is already in the team.");
      setShowSuggestions(false);
      return;
    }
    setIsUpdating(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const updatedPlayers = [...team.players, nameToAdd];
      const updatedTeamData = await updateTeam(team.id, { players: updatedPlayers });
      setTeam(updatedTeamData);
      setNewPlayerName('');
    } catch (err: any) {
      setError(err.message || "Failed to add player.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemovePlayer = async (playerToRemove: string) => {
    if (!team) return;
    if (!window.confirm(`Are you sure you want to remove ${playerToRemove} from the team?`)) {
        return;
    }
    setIsUpdating(true);
    setError(null);
    try {
      const updatedPlayers = team.players.filter(player => player !== playerToRemove);
      const updatedTeamData = await updateTeam(team.id, { players: updatedPlayers });
      setTeam(updatedTeamData);
    } catch (err: any) {
      setError(err.message || "Failed to remove player.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/my-teams')} leftIcon={<ArrowLeftIcon className="w-5 h-5"/>}>
          Back to My Teams
        </Button>
      </div>

       {error && (
        <div role="alert" className="my-4 bg-red-800 bg-opacity-50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {!team && !loading && !error && (
        <div className="text-center p-8 text-xl text-gray-300 bg-gray-800 rounded-lg shadow border border-gray-700">
            Team data could not be loaded or found.
        </div>
      )}

      {team && (
        <>
          <header className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 text-center">
             <UserGroupIcon className="w-16 h-16 text-red-600 mx-auto mb-3 opacity-80" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-50" title={team.name}>{team.name}</h1>
            <p className="text-gray-400 mt-1">{team.players.length} Player{team.players.length !== 1 ? 's' : ''}</p>
          </header>

          <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Manage Players</h2>
            <div className="mb-6 space-y-3 relative">
                <label htmlFor="newPlayerName" className="block text-sm font-medium text-gray-300">Add New Player:</label>
                <div className="flex space-x-2">
                    <input
                    ref={inputRef}
                    type="text"
                    id="newPlayerName"
                    value={newPlayerName}
                    onChange={handlePlayerNameChange}
                    onFocus={() => { if (newPlayerName.trim() && suggestions.length > 0) setShowSuggestions(true);}}
                    placeholder="Enter player name or select suggestion"
                    className={inputClass}
                    autoComplete="off"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if(!showSuggestions || suggestions.length === 0) handleAddPlayer();}}}
                    />
                    <Button 
                        onClick={handleAddPlayer} 
                        isLoading={isUpdating && newPlayerName.trim() !== ""} 
                        disabled={isUpdating}
                        leftIcon={<PlusIcon className="w-5 h-5"/>}
                    >
                    Add
                    </Button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <ul 
                    ref={suggestionBoxRef} 
                    className="absolute z-10 w-[calc(100%-100px)] mt-1 max-h-40 overflow-y-auto bg-gray-600 border border-gray-500 rounded-md shadow-lg"
                    role="listbox"
                  >
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-red-700 hover:text-white cursor-pointer"
                        role="option"
                      >
                        {suggestion.username}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            {team.players.length > 0 ? (
              <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {team.players.map(player => (
                  <li 
                    key={player} 
                    className="flex justify-between items-center bg-gray-700 p-3 rounded-md shadow-sm hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-gray-100 text-sm truncate" title={player}>{player}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemovePlayer(player)}
                      isLoading={isUpdating && team.players.includes(player)} 
                      disabled={isUpdating}
                      leftIcon={<TrashIcon className="w-4 h-4" />}
                      className="px-2 py-1"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-4">No players added to this team yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default TeamDetailsPage;
