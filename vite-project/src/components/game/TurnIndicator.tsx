import { User, Bot, Loader2 } from 'lucide-react';
import type { AIDifficulty } from './AIOpponent';

interface TurnIndicatorProps {
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  aiDifficulty?: AIDifficulty;
  playerScore: number;
  aiScore: number;
  visible: boolean;
}

export const TurnIndicator = ({ 
  isPlayerTurn, 
  isAIThinking, 
  aiDifficulty,
  playerScore,
  aiScore,
  visible 
}: TurnIndicatorProps) => {
  if (!visible) return null;

  const difficultyLabel = aiDifficulty 
    ? aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)
    : '';

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-card/95 backdrop-blur rounded-full px-6 py-3 shadow-xl border border-border flex items-center gap-4">
        {/* Player side */}
        <div className={`flex items-center gap-2 transition-opacity ${isPlayerTurn ? 'opacity-100' : 'opacity-40'}`}>
          <div className={`p-2 rounded-full ${isPlayerTurn ? 'bg-primary' : 'bg-muted'}`}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">You</div>
            <div className="font-bold text-foreground">{playerScore}</div>
          </div>
        </div>

        {/* VS */}
        <div className="px-3">
          <div className={`text-sm font-bold ${
            isAIThinking 
              ? 'text-amber-500 animate-pulse' 
              : isPlayerTurn 
                ? 'text-primary' 
                : 'text-destructive'
          }`}>
            {isAIThinking ? 'Thinking...' : 'VS'}
          </div>
        </div>

        {/* AI side */}
        <div className={`flex items-center gap-2 transition-opacity ${!isPlayerTurn ? 'opacity-100' : 'opacity-40'}`}>
          <div className="text-left">
            <div className="text-xs text-muted-foreground">AI ({difficultyLabel})</div>
            <div className="font-bold text-foreground">{aiScore}</div>
          </div>
          <div className={`p-2 rounded-full ${!isPlayerTurn ? 'bg-destructive' : 'bg-muted'} relative`}>
            {isAIThinking ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Current turn label */}
      <div className="text-center mt-2">
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          isPlayerTurn 
            ? 'bg-primary/20 text-primary' 
            : 'bg-destructive/20 text-destructive'
        }`}>
          {isAIThinking ? "AI is aiming..." : isPlayerTurn ? "Your Turn" : "AI's Turn"}
        </span>
      </div>
    </div>
  );
};
