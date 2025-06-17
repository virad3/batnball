import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { Tournament, Match } from '../types'; 
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
          // Prefer matches array from tournament object if available
          const tournamentMatches = tournamentDetails.matches && tournamentDetails.matches.length > 0 
            ? tournamentDetails.matches 
            : await getMatchesByTournamentId(tournamentDetails.id);
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
  if (!tournament) return <div className="text-center p-8 text-xl text-red-400">Tournament not found. <Link to="/tournaments" className="text-slate-400 hover:underline">Go to Tournaments</Link></div>;

  const TabButton: React.FC<{tabKey: 'fixtures' | 'teams' | 'standings', label: string}> = ({ tabKey, label }) => (
    <Button
        variant={activeTab === tabKey ? 'primary' : 'outline'}
        onClick={() => setActiveTab(tabKey)}
        size="sm"
    >
        {label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <section className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img 
                src={tournament.logoUrl || `https://picsum.photos/seed/${tournament.id}/150/150`} 
                alt={`${tournament.name} logo`} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-2 border-gray-600 flex-shrink-0"
            />
            <div className="text-gray-200 flex-grow">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-50">{tournament.name}</h1>
                <p className="text-md text-gray-300 mt-1">Format: {tournament.format}</p>
                <p className="text-md text-gray-300">
                Dates: {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                </p>
                <p className="text-md text-gray-300">Teams: {tournament.teamNames?.length || 0}</p>
                 {tournament.organizerName && <p className="text-sm text-gray-400 mt-1">Organized by: {tournament.organizerName}</p>}
            </div>
        </div>
      </section>

      <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-4">
        <TabButton tabKey="fixtures" label="Fixtures/Results" />
        <TabButton tabKey="teams" label="Teams" />
        <TabButton tabKey="standings" label="Standings" />
      </div>

      {activeTab === 'fixtures' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Fixtures & Results</h2>
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map(match => <MatchCard key={match.id} match={match} />)}
            </div>
          ) : (
            <p className="text-gray-400">No matches scheduled for this tournament yet.</p>
          )}
        </section>
      )}

      {activeTab === 'teams' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Participating Teams</h2>
          {tournament.teamNames && tournament.teamNames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tournament.teamNames.map((teamName, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-700">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-700 flex items-center justify-center text-xl text-gray-200 font-semibold shadow-inner">
                    {teamName.substring(0,2).toUpperCase()}
                  </div>
                  <p className="font-semibold text-center text-gray-200 truncate">{teamName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No teams registered for this tournament yet.</p>
          )}
        </section>
      )}

      {activeTab === 'standings' && (
        <section>
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Points Table / Standings</h2>
          <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 min-h-[150px]">
            <p className="text-gray-300">Standings feature is simplified. Detailed points table based on match results will be available in a future update.</p>
            {tournament.teamNames && tournament.teamNames.length > 0 && (
                <ul className="list-disc list-inside pl-1 mt-4 space-y-1">
                    {tournament.teamNames.map((name, idx) => <li key={idx} className="text-gray-300">{name}</li>)}
                </ul>
            )}
            {(!tournament.teamNames || tournament.teamNames.length === 0) && <p className="text-gray-400 mt-4">No teams to display standings for.</p>}
          </div>
        </section>
      )}
    </div>
  );
};

export default TournamentDetailPage;