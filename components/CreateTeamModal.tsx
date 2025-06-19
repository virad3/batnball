
import React, { useState, useEffect, useRef } from 'react';
import { Team, UserProfile } from '../types';
import { createTeam, getAllUserProfilesForSuggestions, addUserToTeamAffiliation } from '../services/dataService';
import Button from './Button';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeam: Team) => void;
}

type PlayerSuggestion = Pick<UserProfile, 'id' | 'username'>;
interface ModalPlayer {
  name: string;
  userId?: string; // UserProfile.id if selected from suggestions
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | undefined>(undefined); // Store ID of suggested player
  const [players, setPlayers] = useState<ModalPlayer[]>([]); // Store name and optional userId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allUserProfiles, setAllUserProfiles] = useState<PlayerSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProfiles = async () => {
        try {
          const profiles = await getAllUserProfilesForSuggestions();
          setAllUserProfiles(profiles);
        } catch (err) {
          console.error("Failed to fetch user profiles for suggestions:", err);
        }
      };
      fetchProfiles();
    } else {
      setTeamName('');
      setCurrentPlayerName('');
      setSelectedPlayerId(undefined);
      setPlayers([]);
      setError(null);
      setAllUserProfiles([]);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen]);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);


  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentPlayerName(value);
    setSelectedPlayerId(undefined); // Clear selected ID if typing changes
    setError(null); 

    if (value.trim() && allUserProfiles.length > 0) {
      const filtered = allUserProfiles.filter(profile =>
        profile.username.toLowerCase().includes(value.toLowerCase()) && 
        !players.some(p => p.name === profile.username) // Exclude already added players
      ).slice(0, 5); 
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestedPlayer: PlayerSuggestion) => {
    setCurrentPlayerName(suggestedPlayer.username);
    setSelectedPlayerId(suggestedPlayer.id); // Store the ID of the suggested player
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleAddPlayer = () => {
    const nameToAdd = currentPlayerName.trim();
    if (nameToAdd && !players.some(p => p.name === nameToAdd)) {
      setPlayers(prevPlayers => [...prevPlayers, { name: nameToAdd, userId: selectedPlayerId }]);
      setCurrentPlayerName('');
      setSelectedPlayerId(undefined);
      setSuggestions([]);
      setShowSuggestions(false);
      setError(null);
    } else if (players.some(p => p.name === nameToAdd)) {
      setError("This player is already in the list.");
      setShowSuggestions(false);
    } else if (!nameToAdd) {
      setError("Player name cannot be empty.");
      setShowSuggestions(false);
    }
  };

  const handleRemovePlayer = (playerToRemoveName: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(player => player.name !== playerToRemoveName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }

    setLoading(true);
    try {
      const playerNamesOnly = players.map(p => p.name);
      const newTeamData: Pick<Team, 'name' | 'players' | 'logoUrl'> = {
        name: teamName.trim(),
        players: playerNamesOnly,
        logoUrl: null, 
      };
      const createdTeam = await createTeam(newTeamData);
      
      // After team is created, update profiles of registered players
      const profileUpdatePromises = players
        .filter(player => player.userId) // Only for players added from suggestions (with a userId)
        .map(player => addUserToTeamAffiliation(player.userId!, createdTeam.id));
      
      await Promise.all(profileUpdatePromises);

      onTeamCreated(createdTeam);
      resetFormAndClose();
    } catch (err: any) {
      console.error("Failed to create team or update profiles:", err);
      setError(err.message || "Could not create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetFormAndClose = () => {
    setTeamName('');
    setCurrentPlayerName('');
    setSelectedPlayerId(undefined);
    setPlayers([]);
    setError(null);
    setLoading(false);
    setSuggestions([]);
    setShowSuggestions(false);
    // Keep allUserProfiles loaded if modal might be reopened soon, or clear it:
    // setAllUserProfiles([]); 
    onClose();
  };
  
  const handleClose = () => {
    resetFormAndClose();
  };


  if (!isOpen) return null;

  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-200 mb-1";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-team-modal-title"
    >
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 id="create-team-modal-title" className="text-xl sm:text-2xl font-bold text-gray-50">
            Create New Team
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close create team modal"
            className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 bg-red-800 bg-opacity-40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex-grow overflow-y-auto pr-2" id="create-team-form-modal">
          <div>
            <label htmlFor="teamNameModal" className={labelClass}>Team Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              id="teamNameModal"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter team name"
              aria-required="true"
            />
          </div>

          <div className="relative">
            <label htmlFor="currentPlayerNameModal" className={labelClass}>Add Player</label>
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                id="currentPlayerNameModal"
                value={currentPlayerName}
                onChange={handlePlayerNameChange}
                onFocus={() => { if (currentPlayerName.trim() && suggestions.length > 0) setShowSuggestions(true);}}
                className={inputClass}
                placeholder="Enter player name or select suggestion"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!showSuggestions || suggestions.length === 0) { 
                       handleAddPlayer();
                    }
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddPlayer} leftIcon={<PlusIcon className="w-5 h-5"/>} className="px-3">
                Add
              </Button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <ul 
                ref={suggestionBoxRef} 
                className="absolute z-10 w-[calc(100%-90px)] mt-1 max-h-40 overflow-y-auto bg-gray-600 border border-gray-500 rounded-md shadow-lg"
                role="listbox"
                aria-label="Player suggestions"
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 text-sm text-gray-200 hover:bg-red-700 hover:text-white cursor-pointer"
                    role="option"
                    aria-selected="false" 
                  >
                    {suggestion.username}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {players.length > 0 && (
            <div className="space-y-2 p-3 bg-gray-700 rounded-md border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300">Players ({players.length}):</h4>
              <ul className="max-h-48 overflow-y-auto space-y-1.5">
                {players.map(player => (
                  <li key={player.name} className="flex justify-between items-center bg-gray-600 p-2 rounded-md text-sm text-gray-100">
                    <span className="truncate">{player.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(player.name)}
                      className="text-red-400 hover:text-red-300 p-0.5 rounded-full"
                      aria-label={`Remove ${player.name}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
        
        <div className="mt-8 pt-5 border-t border-gray-700 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="create-team-form-modal" isLoading={loading} disabled={loading || !teamName.trim()} className="w-full sm:w-auto" variant="primary">
            {loading ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;