
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom'; // useNavigate -> useHistory for v5
import { Tournament, TournamentFormat } from '../types'; 
import { createTournament } from '../services/dataService'; // Now uses Firebase
import Button from '../components/Button';

const CreateTournamentPage: React.FC = () => {
  const history = useHistory(); // v5 hook
  const [tournamentName, setTournamentName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>(TournamentFormat.LEAGUE);
  const [startDate, setStartDate] = useState(''); // Store as YYYY-MM-DD string
  const [endDate, setEndDate] = useState('');   // Store as YYYY-MM-DD string
  const [selectedTeamNames, setSelectedTeamNames] = useState<string[]>([]);
  const [customTeamName, setCustomTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCustomTeam = () => {
    if (customTeamName.trim() && !selectedTeamNames.includes(customTeamName.trim())) {
      setSelectedTeamNames(prev => [...prev, customTeamName.trim()]);
      setCustomTeamName('');
    } else if (selectedTeamNames.includes(customTeamName.trim())) {
      alert("Team already added.");
    }
  };

  const handleRemoveTeam = (teamNameToRemove: string) => {
    setSelectedTeamNames(prev => prev.filter(name => name !== teamNameToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tournamentName || !startDate || !endDate || selectedTeamNames.length < 2) {
      setError("Please fill all required fields and add at least two teams.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);

    const newTournamentData: Omit<Tournament, 'id' | 'matches' | 'organizerName' | 'user_id'> = {
      name: tournamentName,
      format,
      startDate, // Pass as string, dataService will convert to Timestamp
      endDate,   // Pass as string
      teamNames: selectedTeamNames,
      logoUrl: logoUrl || undefined,
    };

    try {
      const createdTournament = await createTournament(newTournamentData); // dataService function now uses Firebase
      setLoading(false);
      history.push(`/tournaments/${createdTournament.id}`); // Updated navigation
    } catch (err: any) {
      setError(err.message || "Failed to create tournament. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };
  
  const inputBaseClass = "block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 sm:text-sm text-gray-100 placeholder-gray-400";
  const inputFocusClass = "focus:ring-red-500 focus:border-red-500";
  const inputClass = `${inputBaseClass} ${inputFocusClass}`;
  const labelClass = "block text-sm font-medium text-gray-200";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl border border-gray-700">
      <h1 className="text-3xl font-bold text-gray-50 mb-6 text-center">Create New Tournament</h1>
      {error && <p className="mb-4 text-center text-sm text-red-300 bg-red-800 bg-opacity-50 p-3 rounded-md border border-red-700">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="tournamentName" className={labelClass}>Tournament Name <span className="text-red-400">*</span></label>
          <input type="text" id="tournamentName" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required className={`${inputClass} mt-1`} />
        </div>

        <div>
          <label htmlFor="format" className={labelClass}>Format <span className="text-red-400">*</span></label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)} required className={`${inputClass} mt-1 text-gray-100`}>
            {Object.values(TournamentFormat).map(tf => <option key={tf} value={tf} className="bg-gray-700 text-gray-100">{tf}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="startDate" className={labelClass}>Start Date <span className="text-red-400">*</span></label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={`${inputClass} mt-1 dark-date-picker`} />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>End Date <span className="text-red-400">*</span></label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={`${inputClass} mt-1 dark-date-picker`} />
          </div>
        </div>
         <style>{`
          .dark-date-picker::-webkit-calendar-picker-indicator {
            filter: invert(1) brightness(0.8); 
          }
        `}</style>

        <div>
          <label className={labelClass}>Teams (min. 2) <span className="text-red-400">*</span></label>
           <p className="text-xs text-gray-400 mt-0.5">Add custom team names below.</p>
          <div className="mt-3 flex space-x-2">
            <input 
              type="text" 
              value={customTeamName} 
              onChange={(e) => setCustomTeamName(e.target.value)} 
              placeholder="Enter team name"
              className={`${inputClass} flex-grow`}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTeam();}}}
            />
            <Button type="button" onClick={handleAddCustomTeam} variant="secondary">Add Team</Button>
          </div>
          {selectedTeamNames.length > 0 && (
            <div className="mt-3 p-3 bg-gray-700 rounded-md border border-gray-600">
              <p className="text-xs font-medium text-gray-300 mb-2">Added teams ({selectedTeamNames.length}):</p>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {selectedTeamNames.map(name => (
                    <li key={name} className="flex justify-between items-center text-sm text-gray-200 p-1.5 bg-gray-600 rounded-md">
                        <span className="truncate">{name}</span>
                        <button 
                            type="button" 
                            onClick={() => handleRemoveTeam(name)}
                            className="ml-2 text-red-400 hover:text-red-300 text-xs"
                            aria-label={`Remove ${name}`}
                        >
                            Remove
                        </button>
                    </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="logoUrl" className={labelClass}>Tournament Logo URL (Optional)</label>
          <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className={`${inputClass} mt-1`} />
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button 
            type="button" 
            onClick={() => history.push('/tournaments')} // Updated navigation
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={loading} 
            disabled={loading} 
            className="w-full sm:w-auto text-lg" 
            variant="primary" 
            size="lg"
          >
            {loading ? 'Creating Tournament...' : 'Create Tournament'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournamentPage;
