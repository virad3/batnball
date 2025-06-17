
import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { mockPlayers, mockTeams } from '../services/dataService'; // Using mock data
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button'; // Assuming you have this component
import { COLORS } from '../constants';


const StatsPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');

  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Populate with enhanced mock data for stats
      const enhancedPlayers = mockPlayers.map(p => ({
        ...p,
        runsScored: Math.floor(Math.random() * 500) + 50,
        wicketsTaken: Math.floor(Math.random() * 30),
        matchesPlayed: Math.floor(Math.random() * 20) + 5,
      }));
      setPlayers(enhancedPlayers.sort((a,b) => (b.runsScored || 0) - (a.runsScored || 0) )); // Sort by runs
      
      const enhancedTeams = mockTeams.map(t => ({
          ...t,
          // Add mock team stats if needed later
      }));
      setTeams(enhancedTeams);
      setLoading(false);
    };
    loadMockData();
  }, []);

  const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      {icon && <div className="text-3xl text-[#004d40] mb-2 mx-auto w-min">{icon}</div>}
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className="text-2xl font-bold text-[#004d40]">{value}</p>
    </div>
  );

  const PlayerRow: React.FC<{player: Player, rank: number}> = ({player, rank}) => (
    <tr className={rank % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rank}</td>
        <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center">
                <img className="h-8 w-8 rounded-full object-cover mr-3" src={player.profilePicUrl || `https://picsum.photos/seed/${player.id}/40/40`} alt={player.name} />
                <span className="text-sm font-semibold text-[#004d40]">{player.name}</span>
            </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{player.matchesPlayed}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-[#004d40]">{player.runsScored}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{player.wicketsTaken}</td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{player.runsScored && player.matchesPlayed ? (player.runsScored / player.matchesPlayed).toFixed(2) : 'N/A'}</td>
    </tr>
  );


  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#004d40]">Statistics & Leaderboards</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Most Runs" value={players[0]?.name || 'N/A'} />
        <StatCard title="Total Runs" value={players[0]?.runsScored || 0} />
        <StatCard title="Most Wickets" value={players.sort((a,b) => (b.wicketsTaken || 0) - (a.wicketsTaken || 0))[0]?.name || 'N/A'} />
        <StatCard title="Total Wickets" value={players.sort((a,b) => (b.wicketsTaken || 0) - (a.wicketsTaken || 0))[0]?.wicketsTaken || 0} />
      </div>

      <div className="flex space-x-2 border-b border-gray-300 pb-2 mb-4">
        <Button 
            variant={activeTab === 'players' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('players')}
        >Player Stats</Button>
        <Button 
            variant={activeTab === 'teams' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('teams')}
        >Team Rankings</Button>
      </div>

      {activeTab === 'players' && (
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#004d40] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Player</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Matches</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Runs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Wickets</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Avg Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player, idx) => <PlayerRow key={player.id} player={player} rank={idx+1} /> )}
            </tbody>
          </table>
          {players.length === 0 && <p className="p-4 text-center text-gray-500">No player data available.</p>}
        </div>
      )}

      {activeTab === 'teams' && (
         <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <p className="p-6 text-center text-gray-600">Team rankings coming soon!</p>
            {/* Placeholder for team rankings table */}
        </div>
      )}
    </div>
  );
};

export default StatsPage;
