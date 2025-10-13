import React from 'react';

interface ScoreboardProps {
  playerTeamName: string;
  playerTeamScore: number;
  oppositionTeamName: string;
  oppositionTeamScore: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
  playerTeamName,
  playerTeamScore,
  oppositionTeamName,
  oppositionTeamScore
}) => {
  const playerWon = playerTeamScore > oppositionTeamScore;
  const oppositionWon = oppositionTeamScore > playerTeamScore;
  const isTie = playerTeamScore === oppositionTeamScore;

  const getScoreColor = (isWinner: boolean, isTie: boolean) => {
    if (isTie) return 'text-yellow-400';
    return isWinner ? 'text-green-400' : 'text-gray-400';
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 my-4">
      <div className="text-center mb-3">
        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Final Score</span>
      </div>
      <div className="flex items-center justify-around text-center">
        {/* Player Team */}
        <div className="flex-1 min-w-0">
          <p className={`text-4xl lg:text-5xl font-bold tracking-tighter ${getScoreColor(playerWon, isTie)}`}>
            {playerTeamScore}
          </p>
          <p className="text-sm font-semibold text-gray-200 truncate">{playerTeamName}'s Team</p>
        </div>
        
        {/* Separator */}
        <div className="px-2">
          <p className="text-2xl font-light text-gray-500">VS</p>
        </div>

        {/* Opposition Team */}
        <div className="flex-1 min-w-0">
          <p className={`text-4xl lg:text-5xl font-bold tracking-tighter ${getScoreColor(oppositionWon, isTie)}`}>
            {oppositionTeamScore}
          </p>
          <p className="text-sm font-semibold text-gray-200 truncate">{oppositionTeamName}</p>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;
