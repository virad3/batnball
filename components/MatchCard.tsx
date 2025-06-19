
import React from 'react';
import { Link } from 'react-router-dom'; // Link import is fine for v5
import { Match, InningsRecord } from '../types'; 
import Button from './Button';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

interface MatchCardProps {
  match: Match;
}

const TeamDisplaySimple: React.FC<{ teamName: string, score?: string }> = ({ teamName, score }) => (
  <div className="flex items-center space-x-2">
    <span className="font-semibold text-sm sm:text-base text-gray-100">{teamName}</span>
    {score && <span className="text-lg font-bold text-gray-50">{score}</span>}
  </div>
);

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  // Handle date conversion if it's a Firebase Timestamp or string
  let matchDateObject: Date;
  if (match.date instanceof Timestamp) {
    matchDateObject = match.date.toDate();
  } else if (typeof match.date === 'string') {
    matchDateObject = new Date(match.date);
  } else {
    // Fallback or error handling if date format is unexpected (e.g. null/undefined)
    matchDateObject = new Date(); // Should not happen with proper data handling
    console.warn("Match date is in an unexpected format:", match.date);
  }


  const getTeamScoreDisplay = (teamNameToDisplay: string): string | undefined => {
    let inningsToUse: InningsRecord | null | undefined = null;

    if (match.status === "Live") {
      if (match.current_batting_team === teamNameToDisplay) {
        if (match.innings1Record && match.innings1Record.teamName === match.current_batting_team) {
          inningsToUse = match.innings1Record;
        } else if (match.innings2Record && match.innings2Record.teamName === match.current_batting_team) {
          inningsToUse = match.innings2Record;
        }
      }
    } else if (match.status === "Completed") {
      if (match.innings1Record && match.innings1Record.teamName === teamNameToDisplay) {
        inningsToUse = match.innings1Record;
      } else if (match.innings2Record && match.innings2Record.teamName === teamNameToDisplay) {
        inningsToUse = match.innings2Record;
      }
    }

    if (inningsToUse) {
      return `${inningsToUse.totalRuns}/${inningsToUse.totalWickets} (${inningsToUse.totalOversBowled} Ov)`;
    }
    return undefined;
  };


  const getStatusSpecificStyling = () => {
    switch (match.status) {
      case "Live":
        return { bg: "bg-red-700", text: "text-white" };
      case "Upcoming":
        return { bg: "bg-yellow-600", text: "text-white" };
      case "Completed":
        return { bg: "bg-green-700", text: "text-white" };
      default:
        return { bg: "bg-gray-700", text: "text-gray-100" };
    }
  };
  const statusStyles = getStatusSpecificStyling();

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-700">
      <div className={`p-4 ${statusStyles.bg}`}>
        <div className="flex justify-between items-center">
          <span className={`text-xs font-semibold uppercase tracking-wider ${statusStyles.text}`}>{match.format} - {match.status}</span>
          <span className={`text-xs ${statusStyles.text} opacity-90`}>
            {matchDateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-5 text-gray-300">
        <div className="flex flex-col space-y-3 mb-4">
            <TeamDisplaySimple teamName={match.teamAName} score={getTeamScoreDisplay(match.teamAName)} />
            <div className="pl-10 text-xs text-gray-500">vs</div>
            <TeamDisplaySimple teamName={match.teamBName} score={getTeamScoreDisplay(match.teamBName)} />
        </div>

        <p className="text-xs text-gray-400 mb-3 truncate">{match.venue}</p>
        
        {match.status === "Completed" && match.result_summary && (
          <p className="text-sm font-semibold text-green-400 mb-3">{match.result_summary}</p> 
        )}

        {match.status === "Live" && match.tossWinnerName && (
            <p className="text-xs text-gray-400 mb-3">{match.tossWinnerName} won the toss and elected to {match.electedTo?.toLowerCase()}.</p>
        )}

        <div className="flex justify-end space-x-2 mt-4">
            {match.status !== "Upcoming" && (
                 <Link to={`/matches/${match.id}/score`}>
                    <Button variant="outline" size="sm">
                        {match.status === "Live" ? "Live Score" : "View Scorecard"}
                    </Button>
                </Link>
            )}
             {match.status === "Upcoming" && (
                 <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    className="cursor-not-allowed"
                >
                    Starts Soon
                </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
