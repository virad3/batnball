
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tournament, Match, Team } from '../types';
import { getTournamentById, getMatchesByTournamentId } from '../services/dataService';
import LoadingSpinner from '../components/LoadingSpinner';
import MatchCard from '../components/MatchCard';
import Button from '../components/Button';

const TournamentDetailPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'teams' | 'standings'>('fixtures');


  useEffect(() => {
    if (!tournamentId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const tournamentDetails = await getTournamentById(tournamentId);
        setTournament(tournamentDetails);
        if (tournamentDetails) {
          const tournamentMatches = await getMatchesByTournamentId(tournamentDetails.id);
          setMatches(tournamentMatches);
        }
      } catch (error) {
        console.error("Failed to fetch tournament details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tournamentId]);

  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner size="lg" /></div>;
  if (!tournament) return <div className="text-center p-8 text-xl text-[#d32f2f]">Tournament not found.</div>;

  const TabButton: React.FC<{tabKey: 'fixtures' | 'teams' | 'standings', label: string}> = ({ tabKey, label }) => (
    <Button
        variant={activeTab === tabKey ? 'primary' : 'outline'}
        onClick={() => setActiveTab(tabKey)}
    >
        {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <img 
                src={tournament.logoUrl || `https://picsum.photos/seed/${tournament.id}/150/150`} 
                alt={tournament.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 border-[#004d40]"
            />
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#004d40]">{tournament.name}</h1>
                <p className="text-md text-gray-600">Format: {tournament.format}</p>
                <p className="text-md text-gray-600">
                Dates: {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </p>
                <p className="text-md text-gray-600">Teams: {tournament.teams.length}</p>
                 {tournament.organizer && <p className="text-sm text-gray-500 mt-1">Organized by: {tournament.organizer.username}</p>}
            </div>
        </div>
      </section>

      <div className="flex space-x-2 border-b border-gray-300 pb-2 mb-4">
        <TabButton tabKey="fixtures" label="Fixtures/Results" />
        <TabButton tabKey="teams" label="Teams" />
        <TabButton tabKey="standings" label="Standings" />
      </div>

      {activeTab === 'fixtures' && (
        <section>
          <h2 className="text-2xl font-bold text-[#004d40] mb-4">Fixtures & Results</h2>
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <p className="text-gray-600">No matches scheduled for this tournament yet.</p>
          )}
        </section>
      )}

      {activeTab === 'teams' && (
        <section>
          <h2 className="text-2xl font-bold text-[#004d40] mb-4">Participating Teams</h2>
          {tournament.teams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tournament.teams.map(team => (
                <div key={team.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <img src={team.logoUrl || `https://picsum.photos/seed/${team.id}/80/80`} alt={team.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover bg-gray-200"/>
                  <p className="font-semibold text-center text-[#004d40]">{team.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No teams registered for this tournament yet.</p>
          )}
        </section>
      )}

      {activeTab === 'standings' && (
        <section>
          <h2 className="text-2xl font-bold text-[#004d40] mb-4">Points Table / Standings</h2>
          {/* Mock Standings Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Played</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Won</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NR/Tied</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NRR</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournament.teams.slice(0,4).map((team, idx) => ( // Displaying first 4 teams as mock
                  <tr key={team.id} className={idx % 2 === 0 ? undefined : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#004d40]">{team.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 5) +1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(Math.random() * 2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#004d40]">{Math.floor(Math.random() * 10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+{Math.random().toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
           {tournament.teams.length === 0 && <p className="text-gray-600 mt-4">Standings will appear here once matches are played.</p>}
        </section>
      )}
    </div>
  );
};

export default TournamentDetailPage;
