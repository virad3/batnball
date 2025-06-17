
import React from 'react';
import { Link } from 'react-router-dom';
import { Match, Team } from '../types';
import { COLORS } from '../constants';

interface MatchCardProps {
  match: Match;
}

const TeamDisplay: React.FC<{ team: Team, score?: string }> = ({ team, score }) => (
  <div className="flex items-center space-x-2">
    <img src={team.logoUrl || `https://picsum.photos/seed/${team.id}/40/40`} alt={team.name} className="w-8 h-8 rounded-full object-cover bg-gray-200"/>
    <span className="font-semibold text-sm sm:text-base">{team.name}</span>
    {score && <span className="text-lg font-bold text-[#004d40]">{score}</span>}
  </div>
);

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const matchDate = new Date(match.date);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-200">
      <div className={`p-4 ${match.status === "Live" ? 'bg-[#d32f2f] text-white' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center">
          <span className={`text-xs font-semibold uppercase tracking-wider ${match.status === "Live" ? 'text-yellow-50' : 'text-[#004d40]'}`}>{match.format} - {match.status}</span>
          <span className={`text-xs ${match.status === "Live" ? 'text-yellow-50' : 'text-gray-600'}`}>
            {matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col space-y-3 mb-4">
            <TeamDisplay team={match.teamA} score={match.currentScore && match.currentScore.battingTeam?.id === match.teamA.id ? `${match.currentScore.runs}/${match.currentScore.wickets} (${match.currentScore.overs}.${match.currentScore.ballsThisOver})` : (match.status === "Completed" && match.result?.includes(match.teamA.name) ? 'Winner' : undefined )}/>
            <div className="pl-10 text-xs text-gray-500">vs</div>
            <TeamDisplay team={match.teamB} score={match.currentScore && match.currentScore.battingTeam?.id === match.teamB.id ? `${match.currentScore.runs}/${match.currentScore.wickets} (${match.currentScore.overs}.${match.currentScore.ballsThisOver})` : (match.status === "Completed" && match.result?.includes(match.teamB.name) ? 'Winner' : undefined ) }/>
        </div>

        <p className="text-xs text-gray-500 mb-3 truncate">{match.venue}</p>
        
        {match.status === "Completed" && match.result && (
          <p className="text-sm font-semibold text-[#004d40] mb-3">{match.result}</p>
        )}

        {match.status === "Live" && match.tossWinner && (
            <p className="text-xs text-gray-600 mb-3">{match.tossWinner.name} won the toss and elected to {match.electedTo?.toLowerCase()}.</p>
        )}

        <div className="flex justify-end space-x-2">
            {match.status !== "Upcoming" && (
                 <Link
                    to={`/matches/${match.id}/score`}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#004d40] rounded-md hover:bg-[#00382e] transition-colors"
                >
                    {match.status === "Live" ? "Live Score" : "View Scorecard"}
                </Link>
            )}
             {match.status === "Upcoming" && (
                 <button
                    disabled
                    className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-200 rounded-md cursor-not-allowed"
                >
                    Starts Soon
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
