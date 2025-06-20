

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Match, InningsRecord, MatchFormat } from '../types'; 
import Button from './Button'; 
import { FirebaseTimestamp, Timestamp } from '../services/firebaseClient'; // Use re-exported Timestamp
import { useAuth } from '../contexts/AuthContext';
import { deleteMatchFirebase, updateMatch } from '../services/dataService';
import { PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';


interface MatchCardProps {
  match: Match;
  onMatchModifiedOrDeleted?: () => void; // Callback to refresh match list
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


const MatchCard: React.FC<MatchCardProps> = ({ match, onMatchModifiedOrDeleted }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user && match.user_id === user.uid;

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
  
  let actionButtonPath = `/matches/${match.id}/score`;
  let actionButtonText = "View Scorecard"; // Default for completed
  if (match.status === "Live") actionButtonText = "Live Score";
  else if (match.status === "Upcoming") {
    actionButtonText = "Setup Match & Toss";
    actionButtonPath = `/toss/${match.id}`; // TossPage expects matchId for existing matches
  } else if (match.status === "Abandoned") {
    actionButtonText = "View Details"; // Or scorecard if applicable
  }


  const handleEdit = () => {
    if (match.status === "Upcoming") {
      navigate(`/start-match/edit/${match.id}`);
    } else {
      alert("Only upcoming matches can be fully edited. For live matches, consider abandoning if necessary.");
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    let confirmationMessage = "";
    if (match.status === "Live") {
      confirmationMessage = "Are you sure you want to abandon this live match? This action cannot be undone easily.";
    } else if (match.status === "Upcoming") {
      confirmationMessage = "Are you sure you want to delete this upcoming match? This action is permanent.";
    } else { // Completed or Abandoned
      confirmationMessage = "Are you sure you want to permanently delete this match record?";
    }

    if (window.confirm(confirmationMessage)) {
      setIsDeleting(true);
      try {
        if (match.status === "Live") {
          await updateMatch(match.id, { status: "Abandoned", result_summary: "Match Abandoned by user" });
        } else { // Upcoming, Completed, Abandoned
          await deleteMatchFirebase(match.id);
        }
        if (onMatchModifiedOrDeleted) onMatchModifiedOrDeleted();
      } catch (error: any) {
        alert(`Failed to ${match.status === "Live" ? "abandon" : "delete"} match: ${error.message}`);
        console.error("Error modifying/deleting match:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };


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
          <div className="flex items-center space-x-2">
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
            {match.status === "Abandoned" && (
                <span className="bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                ABANDONED
                </span>
            )}
            {isOwner && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMenu(prev => !prev)}
                  className="p-1.5 border-none hover:bg-gray-700"
                  aria-label="Match options"
                  aria-haspopup="true"
                  aria-expanded={showMenu}
                >
                  <EllipsisVerticalIcon className="w-5 h-5 text-gray-300" />
                </Button>
                {showMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-20 border border-gray-600"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="match-options-button"
                  >
                    <button
                      onClick={handleEdit}
                      disabled={match.status !== "Upcoming" || isDeleting}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-700 hover:text-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" /> {match.status === "Live" ? "Abandon" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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

      <div className="p-4 border-t border-gray-700 flex justify-end">
          <Link to={actionButtonPath}>
            <Button variant="outline" size="sm" disabled={isDeleting}>
                {isDeleting ? 'Processing...' : actionButtonText}
            </Button>
          </Link>
      </div>

    </div>
  );
};

export default MatchCard;