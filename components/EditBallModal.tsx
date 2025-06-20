
import React, { useState, useEffect } from 'react';
import { BallEvent, DismissalType } from '../types';
import Button from './Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditBallModalProps {
  isOpen: boolean;
  onClose: () => void;
  ballEventToEdit: BallEvent | null;
  onSubmit: (updatedEvent: BallEvent) => void;
  currentStrikerName: string | null; 
  currentNonStrikerName: string | null; 
  bowlingTeamSquad: string[] | undefined; 
  battingTeamSquad: string[] | undefined; 
}

const EditBallModal: React.FC<EditBallModalProps> = ({
  isOpen,
  onClose,
  ballEventToEdit,
  onSubmit,
  currentStrikerName,
  currentNonStrikerName,
  bowlingTeamSquad = [],
  battingTeamSquad = [],
}) => {
  const [editedEvent, setEditedEvent] = useState<Partial<BallEvent>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ballEventToEdit) {
      setEditedEvent({ ...ballEventToEdit });
      setError(null);
    } else {
      setEditedEvent({}); 
    }
  }, [ballEventToEdit, isOpen]);

  if (!isOpen || !ballEventToEdit) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'number') {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue as number)) processedValue = name === 'extraRuns' && (editedEvent.extraType === 'Wide' || editedEvent.extraType === 'NoBall') ? (editedEvent.extraType === 'Wide' ? 1: 0) : 0;
      else if (name === 'extraRuns' && editedEvent.extraType === 'Wide' && processedValue < 1) processedValue = 1;

    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setEditedEvent(prev => ({ ...prev, [name]: processedValue }));
    setError(null); 
  };

  const handleExtraTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newExtraType = e.target.value as BallEvent['extraType'] | "";
    let newExtraRuns = editedEvent.extraRuns;

    if (newExtraType === "") { // Clearing extra type
        newExtraRuns = undefined;
    } else if (newExtraType === "Wide") {
        newExtraRuns = editedEvent.extraRuns ?? 1; // Default to 1 for wide, or keep existing if user already set >1
        if (newExtraRuns < 1) newExtraRuns = 1;
    } else if (newExtraType === "NoBall") {
        newExtraRuns = editedEvent.extraRuns ?? 0; // Runs scored OFF the no-ball, 0 if none
    } else { // Byes, LegByes
        newExtraRuns = editedEvent.extraRuns ?? 0;
    }
    
    setEditedEvent(prev => ({
        ...prev,
        extraType: newExtraType === "" ? undefined : newExtraType as BallEvent['extraType'],
        extraRuns: newExtraRuns,
    }));
  };


  const handleWicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isWicketChecked = e.target.checked;
    setEditedEvent(prev => ({
      ...prev,
      isWicket: isWicketChecked,
      wicketType: isWicketChecked ? (prev.wicketType || DismissalType.BOWLED) : undefined,
      batsmanOutName: isWicketChecked ? (prev.batsmanOutName || currentStrikerName || '') : undefined,
      fielderName: isWicketChecked ? prev.fielderName : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!editedEvent.strikerName || !editedEvent.bowlerName) {
        setError("Striker and Bowler names are required for each ball event.");
        return;
    }
    if (editedEvent.isWicket && !editedEvent.wicketType) {
        setError("Please select a dismissal type for the wicket.");
        return;
    }
     if (editedEvent.isWicket && !editedEvent.batsmanOutName) {
        setError("Please select the batsman who was out.");
        return;
    }
    
    let calculatedExtraRuns = editedEvent.extraRuns;
    if (editedEvent.extraType === "NoBall") {
        // `editedEvent.extraRuns` from input is runs scored OFF the no-ball. Add 1 for the no-ball itself.
        calculatedExtraRuns = (editedEvent.extraRuns ?? 0) + 1;
    } else if (editedEvent.extraType === "Wide") {
        // `editedEvent.extraRuns` from input is total runs for the wide. Min 1.
        calculatedExtraRuns = Math.max(1, editedEvent.extraRuns ?? 1);
    }
    // For Byes/LegByes, editedEvent.extraRuns is the value itself.

    if (editedEvent.extraType && (calculatedExtraRuns === undefined || calculatedExtraRuns < (editedEvent.extraType === "Wide" || editedEvent.extraType === "NoBall" ? 1 : 0))) {
        setError(`Invalid extra runs for ${editedEvent.extraType}.`);
        return;
    }
     if (!editedEvent.extraType && (editedEvent.runs === undefined || editedEvent.runs < 0 || editedEvent.runs > 6)) {
        setError("Runs off bat must be between 0 and 6.");
        return;
    }
    
    const finalEvent: BallEvent = {
        ballId: ballEventToEdit.ballId, 
        runs: editedEvent.extraType ? 0 : (editedEvent.runs ?? 0), 
        isWicket: editedEvent.isWicket ?? false,
        wicketType: editedEvent.isWicket ? (editedEvent.wicketType || DismissalType.OTHER) : undefined,
        batsmanOutName: editedEvent.isWicket ? editedEvent.batsmanOutName : undefined,
        bowlerName: editedEvent.bowlerName || ballEventToEdit.bowlerName || 'Unknown Bowler',
        fielderName: editedEvent.isWicket ? editedEvent.fielderName : undefined,
        extraType: editedEvent.extraType || undefined,
        extraRuns: editedEvent.extraType ? calculatedExtraRuns : undefined,
        commentary: editedEvent.commentary || ballEventToEdit.commentary,
        strikerName: editedEvent.strikerName || ballEventToEdit.strikerName || 'Unknown Striker',
    };
    
    onSubmit(finalEvent);
  };
  
  const inputBaseClass = "w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-teal-500 focus:border-teal-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-300 mb-0.5";

  const allPossibleBatsmen = Array.from(new Set([...battingTeamSquad, currentStrikerName, currentNonStrikerName].filter(Boolean))) as string[];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-50">Edit Ball Details</h2>
          <button onClick={onClose} aria-label="Close edit modal" className="p-1 text-gray-400 hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && <p className="text-red-400 bg-red-900 bg-opacity-40 border border-red-700 p-2 rounded-md text-sm mb-3">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar-modal">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className={labelClass}>Striker on this ball:</label>
                <p className="text-gray-200 p-2 bg-gray-700 rounded-md text-sm truncate">{editedEvent.strikerName || 'N/A'}</p>
            </div>
             <div>
                <label className={labelClass}>Bowler for this ball:</label>
                <p className="text-gray-200 p-2 bg-gray-700 rounded-md text-sm truncate">{editedEvent.bowlerName || 'N/A'}</p>
            </div>
          </div>

          {!editedEvent.extraType && (
            <div>
              <label htmlFor="runs" className={labelClass}>Runs off Bat:</label>
              <select id="runs" name="runs" value={editedEvent.runs ?? 0} onChange={handleChange} className={inputClass}>
                {[0, 1, 2, 3, 4, 5, 6].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="extraType" className={labelClass}>Extra Type:</label>
            <select id="extraType" name="extraType" value={editedEvent.extraType || ""} onChange={handleExtraTypeChange} className={inputClass}>
              <option value="">None (Runs off bat)</option>
              <option value="Wide">Wide</option>
              <option value="NoBall">No Ball</option>
              <option value="Byes">Byes</option>
              <option value="LegByes">Leg Byes</option>
            </select>
          </div>

          {editedEvent.extraType === "Wide" && (
            <div>
                <label htmlFor="extraRunsWide" className={labelClass}>Total Wide Runs (min 1):</label>
                <input type="number" id="extraRunsWide" name="extraRuns" value={editedEvent.extraRuns ?? 1} min="1" max="7" onChange={handleChange} className={inputClass} />
            </div>
           )}
           {editedEvent.extraType === "NoBall" && (
            <div>
                <label htmlFor="extraRunsNoBall" className={labelClass}>Runs Scored OFF No Ball (bat/extras, 0-6):</label>
                 <select id="extraRunsNoBall" name="extraRuns" value={editedEvent.extraRuns ?? 0} onChange={handleChange} className={inputClass}>
                    {[0, 1, 2, 3, 4, 5, 6].map(r => <option key={`ernb-${r}`} value={r}>{r}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Total for No Ball event will be these runs + 1.</p>
            </div>
           )}
           {(editedEvent.extraType === "Byes" || editedEvent.extraType === "LegByes") && (
            <div>
              <label htmlFor="extraRunsOther" className={labelClass}>{editedEvent.extraType} Runs (0-6):</label>
               <select id="extraRunsOther" name="extraRuns" value={editedEvent.extraRuns ?? 0} onChange={handleChange} className={inputClass}>
                    {[0, 1, 2, 3, 4, 5, 6].map(r => <option key={`ero-${r}`} value={r}>{r}</option>)}
                </select>
            </div>
          )}


          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="isWicket" checked={editedEvent.isWicket ?? false} onChange={handleWicketChange} className="form-checkbox h-5 w-5 text-teal-600 border-gray-500 rounded focus:ring-teal-500 bg-gray-600 checked:bg-teal-600" />
              <span className={labelClass + " mb-0"}>Is it a Wicket?</span>
            </label>
          </div>

          {editedEvent.isWicket && (
            <div className="space-y-3 p-3 bg-gray-700 rounded-md border border-gray-600">
              <div>
                <label htmlFor="wicketType" className={labelClass}>Dismissal Type:</label>
                <select id="wicketType" name="wicketType" value={editedEvent.wicketType || DismissalType.BOWLED} onChange={handleChange} className={inputClass}>
                  {Object.values(DismissalType).filter(dt => dt !== DismissalType.NOT_OUT).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="batsmanOutName" className={labelClass}>Batsman Out:</label>
                <select id="batsmanOutName" name="batsmanOutName" value={editedEvent.batsmanOutName || ''} onChange={handleChange} className={inputClass}>
                  <option value="">Select Batsman</option>
                  {allPossibleBatsmen.map(p => <option key={`bout-${p}`} value={p}>{p}</option>)}
                </select>
              </div>
              {(editedEvent.wicketType === DismissalType.CAUGHT || editedEvent.wicketType === DismissalType.RUN_OUT || editedEvent.wicketType === DismissalType.STUMPED) && (
                <div>
                  <label htmlFor="fielderName" className={labelClass}>Fielder:</label>
                  <select id="fielderName" name="fielderName" value={editedEvent.fielderName || ""} onChange={handleChange} className={inputClass}>
                    <option value="">Select Fielder</option>
                    {bowlingTeamSquad.map(p => <option key={`f-${p}`} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
          <style>{`.custom-scrollbar-modal::-webkit-scrollbar { width: 6px; } .custom-scrollbar-modal::-webkit-scrollbar-track { background: #374151; border-radius:3px; } .custom-scrollbar-modal::-webkit-scrollbar-thumb { background: #4b5563; border-radius:3px; }`}</style>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="edit-ball-modal-form" onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default EditBallModal;
