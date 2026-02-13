import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, XCircle, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameResultProps {
  isOpen: boolean;
  isWin: boolean;
  marblesChange: number;
  onPlayAgain: () => void;
  levelName: string;
}

export const GameResult = ({ 
  isOpen, 
  isWin, 
  marblesChange, 
  onPlayAgain,
  levelName 
}: GameResultProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && isWin) {
      // Trigger confetti-like effect
      const confetti = document.createElement('div');
      confetti.className = 'fixed inset-0 pointer-events-none z-50';
      confetti.innerHTML = Array.from({ length: 20 }, (_, i) => `
        <div class="absolute animate-float" style="
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 2}s;
        ">
          <div class="w-3 h-3 rounded-full" style="background: hsl(${Math.random() * 360} 70% 60%)"></div>
        </div>
      `).join('');
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 3000);
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`
          bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in
          border-4 ${isWin ? 'border-gold' : 'border-destructive'}
        `}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isWin ? (
            <div className="relative">
              <Trophy className="w-20 h-20 text-gold animate-bounce-slow" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-gold animate-pulse" />
            </div>
          ) : (
            <XCircle className="w-20 h-20 text-destructive" />
          )}
        </div>

        {/* Title */}
        <h2 className={`text-3xl font-bold text-center mb-2 ${isWin ? 'text-gold text-shadow-gold' : 'text-destructive'}`}>
          {isWin ? '🎉 Victory!' : 'Try Again!'}
        </h2>
        
        <p className="text-center text-muted-foreground mb-4">
          {levelName}
        </p>

        {/* Marble Change */}
        <div className={`
          text-center py-4 px-6 rounded-xl mb-6
          ${isWin ? 'bg-gold/20' : 'bg-destructive/20'}
        `}>
          <p className="text-lg text-muted-foreground mb-1">Marbles</p>
          <p className={`text-4xl font-bold ${isWin ? 'text-green-600' : 'text-destructive'}`}>
            {marblesChange > 0 ? '+' : ''}{marblesChange}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button 
            className={`flex-1 ${isWin ? 'bg-gold hover:bg-gold/90 text-earth' : ''}`}
            onClick={onPlayAgain}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};
