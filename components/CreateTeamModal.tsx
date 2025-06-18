import React, { useState } from 'react';
import { Team } from '../types';
import { createTeam } from '../services/dataService';
import Button from './Button';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: (newTeam: Team) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlayer = () => {
    if (currentPlayerName.trim() && !players.includes(currentPlayerName.trim())) {
      setPlayers(prevPlayers => [...prevPlayers, currentPlayerName.trim()]);
      setCurrentPlayerName('');
      setError(null);
    } else if (players.includes(currentPlayerName.trim())) {
      setError("This player is already in the list.");
    } else if (!currentPlayerName.trim()) {
      setError("Player name cannot be empty.");
    }
  };

  const handleRemovePlayer = (playerToRemove: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(player => player !== playerToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    if (players.length === 0) {
      setError("Please add at least one player to the team.");
      // Or allow creating team with 0 players if desired:
      // if (window.confirm("Create team with no players?")) { /* proceed */ } else { return; }
      // return; 
    }

    setLoading(true);
    try {
      const newTeamData: Pick<Team, 'name' | 'players' | 'logoUrl'> = {
        name: teamName.trim(),
        players,
        logoUrl: null, // Placeholder for future logo functionality
      };
      const createdTeam = await createTeam(newTeamData);
      onTeamCreated(createdTeam);
      resetForm();
    } catch (err: any) {
      console.error("Failed to create team:", err);
      setError(err.message || "Could not create team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTeamName('');
    setCurrentPlayerName('');
    setPlayers([]);
    setError(null);
    setLoading(false);
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
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

        <form onSubmit={handleSubmit} className="space-y-5 flex-grow overflow-y-auto pr-2">
          <div>
            <label htmlFor="teamName" className={labelClass}>Team Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className={inputClass}
              placeholder="Enter team name"
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="currentPlayerName" className={labelClass}>Add Player</label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="currentPlayerName"
                value={currentPlayerName}
                onChange={(e) => setCurrentPlayerName(e.target.value)}
                className={inputClass}
                placeholder="Enter player name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPlayer();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddPlayer} leftIcon={<PlusIcon className="w-5 h-5"/>} className="px-3">
                Add
              </Button>
            </div>
          </div>

          {players.length > 0 && (
            <div className="space-y-2 p-3 bg-gray-700 rounded-md border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300">Players ({players.length}):</h4>
              <ul className="max-h-48 overflow-y-auto space-y-1.5">
                {players.map(player => (
                  <li key={player} className="flex justify-between items-center bg-gray-600 p-2 rounded-md text-sm text-gray-100">
                    <span className="truncate">{player}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(player)}
                      className="text-red-400 hover:text-red-300 p-0.5 rounded-full"
                      aria-label={`Remove ${player}`}
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
          <Button type="submit" form="create-team-form" onClick={handleSubmit} isLoading={loading} disabled={loading || !teamName.trim()} className="w-full sm:w-auto" variant="primary">
            {loading ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </div>
    </div>
  );
};
// Helper to name the form for the submit button outside the form structure due to modal layout
// This is not strictly necessary if the button is inside the <form> tag itself.
// Since the form structure is straightforward, I'll bind submit to the button directly.
// The form tag should wrap the inputs and the submit button or be referenced by form attribute.
// I'll make sure the form submission works by having the submit button call handleSubmit.

export default CreateTeamModal;