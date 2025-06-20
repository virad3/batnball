
import React from 'react';
import { BallEvent } from '../types';

interface BallDisplayIconProps {
  ballEvent: BallEvent | null; // Null if ball not bowled yet
  ballNumberInOver: number; // 1 to 6
  onClick?: () => void; // Optional, only for bowled balls
  isCurrentBall?: boolean; // To highlight the next ball to be bowled
}

const BallDisplayIcon: React.FC<BallDisplayIconProps> = ({ ballEvent, ballNumberInOver, onClick, isCurrentBall }) => {
  let displayValue = '';
  let bgColor = 'bg-gray-600'; // Default for not bowled or dot ball if event is null but should be bowled
  let textColor = 'text-gray-300';
  let borderColor = 'border-gray-500';
  let title = `Ball ${ballNumberInOver}`;

  if (isCurrentBall && !ballEvent) {
    bgColor = 'bg-yellow-500 animate-pulse';
    textColor = 'text-gray-900';
    borderColor = 'border-yellow-300';
    displayValue = '?';
    title = `Ball ${ballNumberInOver} (Next ball)`;
  } else if (ballEvent) {
    if (ballEvent.isWicket) {
      displayValue = 'W';
      bgColor = 'bg-red-600';
      textColor = 'text-white';
      borderColor = 'border-red-400';
      title = `Wicket on ball ${ballNumberInOver}`;
    } else if (ballEvent.extraType) {
      if (ballEvent.extraType === "Wide") displayValue = "WD";
      else if (ballEvent.extraType === "NoBall") displayValue = "NB";
      else if (ballEvent.extraType === "Byes") displayValue = `${ballEvent.extraRuns || 0}B`;
      else if (ballEvent.extraType === "LegByes") displayValue = `${ballEvent.extraRuns || 0}LB`;
      else displayValue = `${ballEvent.extraRuns || 0}X`; // Generic extra
      
      bgColor = 'bg-yellow-600';
      textColor = 'text-gray-900';
      borderColor = 'border-yellow-400';
      title = `${ballEvent.extraType} (${ballEvent.extraRuns || 0} runs) on ball ${ballNumberInOver}`;

    } else { // Runs off the bat
      displayValue = String(ballEvent.runs);
      if (ballEvent.runs === 0) {
        bgColor = 'bg-gray-500';
        textColor = 'text-gray-100';
        borderColor = 'border-gray-400';
        title = `Dot ball on ball ${ballNumberInOver}`;
      } else if (ballEvent.runs === 4 || ballEvent.runs === 6) {
        bgColor = 'bg-green-600';
        textColor = 'text-white';
        borderColor = 'border-green-400';
        title = `${ballEvent.runs} runs on ball ${ballNumberInOver}`;
      } else {
        bgColor = 'bg-blue-600';
        textColor = 'text-white';
        borderColor = 'border-blue-400';
        title = `${ballEvent.runs} run(s) on ball ${ballNumberInOver}`;
      }
    }
  } else {
    // Ball not bowled yet, but not the current ball
    displayValue = ''; // Keep it empty or use a placeholder like '-'
    bgColor = 'bg-gray-700'; // Slightly darker for unbowled
    textColor = 'text-gray-500';
    borderColor = 'border-gray-600';
    title = `Ball ${ballNumberInOver} (Not bowled)`;
  }

  const baseClasses = `w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-sm sm:text-base font-semibold transition-all duration-150`;
  const clickableClasses = onClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-yellow-400' : 'cursor-default';

  return (
    <button
      type="button"
      onClick={ballEvent ? onClick : undefined} // Only allow click if ballEvent exists
      className={`${baseClasses} ${bgColor} ${textColor} ${borderColor} ${clickableClasses}`}
      title={title}
      aria-label={title}
      disabled={!ballEvent || !onClick}
    >
      {displayValue}
    </button>
  );
};

export default BallDisplayIcon;
