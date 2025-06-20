
import React from 'react';
import { Score, Match } from '../types'; 

interface ScoreDisplayProps {
  score: Score | null; 
  target?: number | null;
  currentInnings: 1 | 2;
  totalOvers?: number; 
  strikerName?: string | null;
  nonStrikerName?: string | null;
  bowlerName?: string | null;
  matchStatus?: Match['status'] | null;
  resultSummary?: string | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ 
    score, 
    target, 
    currentInnings, 
    totalOvers,
    strikerName,
    nonStrikerName,
    bowlerName,
    matchStatus,
    resultSummary
}) => {
  if (!score) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg shadow text-center text-gray-400">
        Waiting for score update...
      </div>
    );
  }

  const { runs, wickets, overs, ballsThisOver, battingTeamName } = score;

  const calculateRemainingBalls = () => {
    if (!totalOvers || currentInnings !== 2 || !target) return null;
    const maxBalls = totalOvers * 6;
    const ballsBowled = overs * 6 + ballsThisOver;
    return maxBalls - ballsBowled;
  };

  const remainingBalls = calculateRemainingBalls();
  const showMatchEndSummary = matchStatus === "Completed" || matchStatus === "Abandoned";

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-xl space-y-4 border border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-100">{battingTeamName}</h2>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold transition-all duration-300 text-gray-50">
            {runs}<span className="text-3xl text-gray-300">/{wickets}</span>
          </p>
          <p className="text-lg text-gray-300">
            Overs: {overs}.{ballsThisOver}
          </p>
        </div>
      </div>

      {currentInnings === 2 && target && !showMatchEndSummary && (
        <div className="text-center border-t border-gray-700 pt-4 mt-2">
            <p className="text-md text-gray-200">Target: <span className="font-bold text-gray-50">{target}</span></p>
            {target - runs > 0 && remainingBalls !== null && remainingBalls > 0 && (
                 <p className="text-md text-gray-200">{battingTeamName} need <span className="font-bold text-gray-50">{target - runs}</span> runs to win from <span className="font-bold text-gray-50">{remainingBalls}</span> balls remaining.</p>
            )}
             {target - runs <= 0 && <p className="text-md font-bold text-green-400">{battingTeamName} won!</p>}
             {remainingBalls !== null && remainingBalls === 0 && target - runs > 0 && <p className="text-md font-bold text-red-500">Bowling team won!</p>}
        </div>
      )}

      {showMatchEndSummary && resultSummary && (
        <div className="text-center border-t border-gray-700 pt-4 mt-2">
          <p className={`text-lg font-bold ${matchStatus === "Completed" ? "text-green-400" : "text-yellow-400"}`}>
            {resultSummary}
          </p>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700 mt-2">
        <div>
          <p className="text-xs uppercase text-gray-400">Current Batsmen</p>
          <p className="font-semibold text-gray-200 truncate" title={`Striker: ${strikerName || 'N/A'}, Non-Striker: ${nonStrikerName || 'N/A'}`}>
            {strikerName || 'N/A'} (S)
          </p>
          <p className="font-semibold text-gray-200 truncate">
            {nonStrikerName || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-400">Current Bowler</p>
          <p className="font-semibold text-gray-200 truncate" title={bowlerName || 'N/A'}>
            {bowlerName || 'N/A'}
          </p>
        </div>
         <div>
          <p className="text-xs uppercase text-gray-400">Status</p>
          <p className="font-semibold text-gray-200">{ matchStatus ? (matchStatus === "Completed" ? "Match Ended" : matchStatus) : (wickets >= 10 ? "All Out" : "Batting")}</p>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
    