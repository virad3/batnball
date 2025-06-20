import React from 'react';
import { Link } from 'react-router-dom';
import { Match, InningsRecord, MatchFormat } from '../types'; 
import Button from './Button'; 
import { FirebaseTimestamp, Timestamp } from '../services/firebaseClient'; // Use re-exported Timestamp

interface MatchCardProps {
  match: Match;
}

const formatDateForCard = (dateInput: string | FirebaseTimestamp | undefined | null): string => {
  if (!dateInput) return 'N/A';
  let d: Date;
  if (dateInput instanceof Timestamp) { // Use the imported Timestamp
    d = dateInput.toDate();
  } else {
    d = new Date(dateInput as string | Date); 
  }
  if (isNaN(d.getTime())) return 'Invalid Date'; 

  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }); 
  const year = d.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
};


const TeamScoreDisplay: React.FC<{ teamName: string, score?: string, teamColor?: string }> = ({ teamName, score, teamColor = "text-gray-100" }) => (
  <div className="flex justify-between items-center">
    <span className={`font-semibold text-base sm:text-lg ${teamColor} truncate pr-2`}>{teamName}</span>
    {score && <span className={`text-base sm:text-lg font-bold ${teamColor}`}>{score}</span>}
  </div>
);


const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const matchDateFormatted = formatDateForCard(match.date);
  const oversText = match.overs_per_innings ? `${match.overs_per_innings} Ov.` : (match.format === MatchFormat.TEST ? 'Test Match' : 'N/A Ov.');

  let team1Name = match.teamAName;
  let team2Name = match.teamBName;
  let team1Score: string | undefined;
  let team2Score: string | undefined;

  const assignScores = () => {
    const innings1 = match.innings1Record;
    const innings2 = match.innings2Record;

    if (innings1) {
      if (innings1.teamName === match.teamAName) {
        team1Score = `${innings1.totalRuns}/${innings1.totalWickets} (${innings1.totalOversBowled} Ov)`;
        if (innings2 && innings2.teamName === match.teamBName) {
          team2Score = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOversBowled} Ov)`;
        } else if (match.current_batting_team === match.teamBName && innings2) { 
           team2Score = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOversBowled} Ov)`;
        }
      } else if (innings1.teamName === match.teamBName) {
        team2Score = `${innings1.totalRuns}/${innings1.totalWickets} (${innings1.totalOversBowled} Ov)`;
         if (innings2 && innings2.teamName === match.teamAName) {
          team1Score = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOversBowled} Ov)`;
        } else if (match.current_batting_team === match.teamAName && innings2) { 
           team1Score = `${innings2.totalRuns}/${innings2.totalWickets} (${innings2.totalOversBowled} Ov)`;
        }
      }
    }
  };
  
  assignScores();

  const matchSeriesName = match.tournament_id ? "Tournament Match" : `${match.format} Match`;

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-gray-200">{matchSeriesName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {match.venue} | {matchDateFormatted} | {oversText}
            </p>
          </div>
          {match.status === "Completed" && (
            <span className="bg-gray-700 text-gray-200 text-xs font-bold px-3 py-1 rounded-full">
              RESULT
            </span>
          )}
           {match.status === "Live" && (
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              LIVE
            </span>
          )}
          {match.status === "Upcoming" && (
             <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              UPCOMING
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        <TeamScoreDisplay teamName={team1Name} score={team1Score} teamColor="text-teal-400" />
        <TeamScoreDisplay teamName={team2Name} score={team2Score} />
        
        {match.result_summary && (
          <p className="text-sm text-gray-300 pt-1">{match.result_summary}</p>
        )}
         {match.status === "Live" && !match.result_summary && match.tossWinnerName && (
             <p className="text-xs text-gray-400 pt-1">{match.tossWinnerName} won toss & elected to {match.electedTo}.</p>
        )}
      </div>

      {(match.tournament_id && (match.status === "Completed" || match.status === "Live")) && (
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-4">
          <Link 
            to={`/tournaments/${match.tournament_id}?tab=standings`} 
            className="text-teal-400 hover:text-teal-300 text-xs font-semibold uppercase"
          >
            POINTS TABLE
          </Link>
          <Link 
            to={`/tournaments/${match.tournament_id}?tab=leaderboard`} 
            className="text-teal-400 hover:text-teal-300 text-xs font-semibold uppercase"
          >
            LEADERBOARD
          </Link>
        </div>
      )}
      {(!match.tournament_id || match.status === "Upcoming") && (
         <div className="p-4 border-t border-gray-700 flex justify-end">
            <Link to={`/matches/${match.id}/score`}>
              <Button variant="outline" size="sm">
                  {match.status === "Live" ? "Live Score" : (match.status === "Completed" ? "View Scorecard" : "Match Details")}
              </Button>
            </Link>
         </div>
      )}

    </div>
  );
};

export default MatchCard;