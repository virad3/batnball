
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile } from '../types';
import Button from './Button';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have this

interface EditMatchSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  initialSquad: string[];
  allKnownPlayers: Pick<UserProfile, 'id' | 'username'>[]; // For suggestions
  onConfirmSquad: (finalSquad: string[]) => void;
}

const SQUAD_LIMIT = 11;

const EditMatchSquadModal: React.FC<EditMatchSquadModalProps> = ({
  isOpen,
  onClose,
  teamName,
  initialSquad,
  allKnownPlayers,
  onConfirmSquad,
}) => {
  const [currentSquad, setCurrentSquad] = useState<string[]>([]);
  const [inputPlayerName, setInputPlayerName] = useState('');
  const [suggestions, setSuggestions] = useState<Pick<UserProfile, 'id' | 'username'>[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentSquad([...initialSquad]); // Clone initial squad
      setInputPlayerName('');
      setError(null);
      setShowSuggestions(false);
    }
  }, [isOpen, initialSquad]);

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

  const handleInputPlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputPlayerName(value);
    setError(null);

    if (value.trim()) {
      const filtered = allKnownPlayers.filter(profile =>
        profile.username.toLowerCase().includes(value.toLowerCase()) &&
        !currentSquad.some(p => p.toLowerCase() === profile.username.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddPlayerFromInput = (playerName?: string, playerUserId?: string) => {
    const nameToAdd = (playerName || inputPlayerName).trim();
    if (!nameToAdd) {
      setError("Player name cannot be empty.");
      setShowSuggestions(false);
      return;
    }
    if (currentSquad.length >= SQUAD_LIMIT) {
      setError(`Squad is full. Cannot add more than ${SQUAD_LIMIT} players.`);
      setShowSuggestions(false);
      return;
    }
    if (currentSquad.some(p => p.toLowerCase() === nameToAdd.toLowerCase())) {
      setError("This player is already in the squad.");
      setShowSuggestions(false);
      return;
    }
    setCurrentSquad(prev => [...prev, nameToAdd]);
    setInputPlayerName('');
    setShowSuggestions(false);
    setError(null);
  };
  
  const handleSuggestionClick = (suggestion: Pick<UserProfile, 'id' | 'username'>) => {
    handleAddPlayerFromInput(suggestion.username, suggestion.id);
    // No need to set inputPlayerName here if addPlayer handles it
  };


  const handleRemovePlayer = (playerToRemove: string) => {
    setCurrentSquad(prev => prev.filter(p => p !== playerToRemove));
    setError(null);
  };

  const handleSubmitSquad = () => {
    if (currentSquad.length !== SQUAD_LIMIT) {
      setError(`Squad must have exactly ${SQUAD_LIMIT} players. Currently: ${currentSquad.length}.`);
      return;
    }
    onConfirmSquad(currentSquad);
    onClose();
  };
  
  if (!isOpen) return null;

  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-teal-500 focus:border-teal-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-200 mb-1";

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-squad-modal-title"
    >
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 id="edit-squad-modal-title" className="text-xl sm:text-2xl font-bold text-gray-50">
            Configure Squad for {teamName}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close squad edit modal"
            className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 bg-red-800 bg-opacity-40 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-gray-300 mb-3">Select exactly {SQUAD_LIMIT} players for the match.</p>

        <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar-modal">
            <div>
              <label htmlFor="inputPlayerNameModalSquad" className={labelClass}>Add Player Name</label>
              <div className="flex space-x-2 relative">
                <input
                  ref={inputRef}
                  type="text"
                  id="inputPlayerNameModalSquad"
                  value={inputPlayerName}
                  onChange={handleInputPlayerNameChange}
                  onFocus={() => { if (inputPlayerName.trim() && suggestions.length > 0) setShowSuggestions(true);}}
                  className={inputClass}
                  placeholder="Type name or find registered player"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if(!showSuggestions || suggestions.length === 0) handleAddPlayerFromInput();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => handleAddPlayerFromInput()} leftIcon={<PlusIcon className="w-5 h-5"/>} className="px-3" disabled={currentSquad.length >= SQUAD_LIMIT}>
                  Add
                </Button>
              </div>
               {showSuggestions && suggestions.length > 0 && (
                  <ul 
                    ref={suggestionBoxRef} 
                    className="absolute z-20 w-[calc(100%-110px)] mt-1 max-h-40 overflow-y-auto bg-gray-600 border border-gray-500 rounded-md shadow-lg"
                    role="listbox"
                    aria-label="Player suggestions"
                  >
                    {suggestions.map((suggestion) => (
                      <li
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-2 text-sm text-gray-200 hover:bg-teal-700 hover:text-white cursor-pointer"
                        role="option"
                        aria-selected="false" 
                      >
                        {suggestion.username}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
            
            {currentSquad.length > 0 && (
                <div className="space-y-2 p-3 bg-gray-700 rounded-md border border-gray-600">
                <h4 className="text-sm font-medium text-gray-300">Current Match Squad ({currentSquad.length}/{SQUAD_LIMIT}):</h4>
                <ul className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar-inner">
                    {currentSquad.map(player => (
                    <li key={player} className="flex justify-between items-center bg-gray-600 p-2 rounded-md text-sm text-gray-100">
                        <span className="truncate">{player}</span>
                        <button
                        type="button"
                        onClick={() => handleRemovePlayer(player)}
                        className="text-red-400 hover:text-red-300 p-0.5 rounded-full"
                        aria-label={`Remove ${player} from squad`}
                        >
                        <TrashIcon className="w-4 h-4" />
                        </button>
                    </li>
                    ))}
                </ul>
                </div>
            )}
        </div>
        <style>{`
        .custom-scrollbar-modal::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar-modal::-webkit-scrollbar-track { background: #374151; border-radius:3px; }
        .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #4b5563; border-radius:3px; }
        .custom-scrollbar-inner::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-inner::-webkit-scrollbar-track { background: #4b5563; border-radius: 2px; }
        .custom-scrollbar-inner::-webkit-scrollbar-thumb { background: #9ca3af; border-radius: 2px; }
        `}</style>
        
        <div className="mt-8 pt-5 border-t border-gray-700 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmitSquad} 
            disabled={currentSquad.length !== SQUAD_LIMIT} 
            className="w-full sm:w-auto" 
            variant="primary"
          >
            Confirm Squad ({currentSquad.length}/{SQUAD_LIMIT})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditMatchSquadModal;
