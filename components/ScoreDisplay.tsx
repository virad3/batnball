
import React from 'react';
import { Score, Team, Player } from '../types';

interface ScoreDisplayProps {
  score: Score | null;
  target?: number | null;
  currentInnings: 1 | 2;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, target, currentInnings }) => {
  if (!score) {
    return (
      <div className="p-4 bg-white rounded-lg shadow text-center text-gray-500">
        Waiting for score update...
      </div>
    );
  }

  const { runs, wickets, overs, ballsThisOver, battingTeam, currentStriker, currentNonStriker, currentBowler } = score;

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl text-[#004d40] space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src={battingTeam.logoUrl || `https://picsum.photos/seed/${battingTeam.id}/40/40`} alt={battingTeam.name} className="w-10 h-10 rounded-full object-cover"/>
          <h2 className="text-2xl font-bold">{battingTeam.name}</h2>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold transition-all duration-300">
            {runs}<span className="text-3xl">/{wickets}</span>
          </p>
          <p className="text-lg">
            Overs: {overs}.{ballsThisOver}
          </p>
        </div>
      </div>

      {currentInnings === 2 && target && (
        <div className="text-center border-t border-gray-200 pt-3">
            <p className="text-md">Target: <span className="font-bold">{target}</span></p>
            <p className="text-md">{battingTeam.name} need <span className="font-bold">{target - runs}</span> runs to win from <span className="font-bold">{ ( (score.overs || 0) * 6 + (score.ballsThisOver || 0) ) - ( ( (score.overs||0) * 6) + (score.ballsThisOver||0) ) /* TODO: Fix remaining balls calculation */ }</span> balls remaining.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs uppercase text-gray-500">Striker</p>
          <p className="font-semibold">{currentStriker?.name || 'N/A'}</p>
          {/* <p className="text-sm">Runs: 0 (0)</p> */}
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Non-Striker</p>
          <p className="font-semibold">{currentNonStriker?.name || 'N/A'}</p>
          {/* <p className="text-sm">Runs: 0 (0)</p> */}
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Bowler</p>
          <p className="font-semibold">{currentBowler?.name || 'N/A'}</p>
          {/* <p className="text-sm">O-M-R-W: 0-0-0-0</p> */}
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
