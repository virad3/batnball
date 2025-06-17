
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament, TournamentFormat, Team } from '../types';
import { createTournament, mockTeams } from '../services/dataService';
import Button from '../components/Button';
import { COLORS } from '../constants';

const CreateTournamentPage: React.FC = () => {
  const navigate = useNavigate();
  const [tournamentName, setTournamentName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>(TournamentFormat.LEAGUE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]); // Store team IDs
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use mockTeams for selection for now
  const availableTeams = mockTeams;

  const handleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tournamentName || !startDate || !endDate || selectedTeams.length < 2) {
      setError("Please fill all required fields and select at least two teams.");
      return;
    }
    setLoading(true);

    const newTournamentData: Omit<Tournament, 'id' | 'matches' | 'organizer'> = {
      name: tournamentName,
      format,
      startDate,
      endDate,
      teams: availableTeams.filter(team => selectedTeams.includes(team.id)),
      logoUrl: logoUrl || `https://picsum.photos/seed/${tournamentName}/400/200`,
    };

    try {
      const createdTournament = await createTournament(newTournamentData);
      setLoading(false);
      navigate(`/tournaments/${createdTournament.id}`);
    } catch (err) {
      setError("Failed to create tournament. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#004d40] focus:border-[#004d40] sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-xl">
      <h1 className="text-3xl font-bold text-[#004d40] mb-6 text-center">Create New Tournament</h1>
      {error && <p className="mb-4 text-center text-sm text-[#d32f2f] bg-red-100 p-3 rounded-md">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="tournamentName" className={labelClass}>Tournament Name <span className="text-[#d32f2f]">*</span></label>
          <input type="text" id="tournamentName" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label htmlFor="format" className={labelClass}>Format <span className="text-[#d32f2f]">*</span></label>
          <select id="format" value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)} required className={inputClass}>
            {Object.values(TournamentFormat).map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className={labelClass}>Start Date <span className="text-[#d32f2f]">*</span></label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>End Date <span className="text-[#d32f2f]">*</span></label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Select Teams (min. 2) <span className="text-[#d32f2f]">*</span></label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-md">
            {availableTeams.map(team => (
              <label key={team.id} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${selectedTeams.includes(team.id) ? 'bg-[#004d40] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <input 
                  type="checkbox" 
                  checked={selectedTeams.includes(team.id)} 
                  onChange={() => handleTeamSelection(team.id)}
                  className="form-checkbox h-4 w-4 text-[#d32f2f] border-gray-300 rounded focus:ring-[#d32f2f]"
                />
                <img src={team.logoUrl || `https://picsum.photos/seed/${team.id}/20/20`} alt={team.name} className="w-5 h-5 rounded-full object-cover"/>
                <span className="text-sm">{team.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="logoUrl" className={labelClass}>Tournament Logo URL (Optional)</label>
          <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className={inputClass} />
        </div>

        <div className="pt-2">
          <Button type="submit" isLoading={loading} disabled={loading} className="w-full text-lg" variant="primary">
            {loading ? 'Creating Tournament...' : 'Create Tournament'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTournamentPage;
