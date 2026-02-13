import { Button } from '@/components/ui/button';
import { Bot, Swords, Brain, Sparkles } from 'lucide-react';
import type { AIDifficulty } from './AIOpponent';

interface DifficultySelectorProps {
  isOpen: boolean;
  onSelectDifficulty: (difficulty: AIDifficulty) => void;
  onPlaySolo: () => void;
  levelName: string;
}

const DIFFICULTIES = [
  {
    id: 'easy' as AIDifficulty,
    name: 'Easy',
    description: 'AI makes frequent mistakes',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'bg-green-500 hover:bg-green-600',
    borderColor: 'border-green-500',
  },
  {
    id: 'medium' as AIDifficulty,
    name: 'Medium',
    description: 'Balanced challenge',
    icon: <Brain className="w-8 h-8" />,
    color: 'bg-amber-500 hover:bg-amber-600',
    borderColor: 'border-amber-500',
  },
  {
    id: 'hard' as AIDifficulty,
    name: 'Hard',
    description: 'AI plays near-perfect',
    icon: <Swords className="w-8 h-8" />,
    color: 'bg-red-500 hover:bg-red-600',
    borderColor: 'border-red-500',
  },
];

export const DifficultySelector = ({ 
  isOpen, 
  onSelectDifficulty, 
  onPlaySolo,
  levelName 
}: DifficultySelectorProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-4 bg-background rounded-full shadow-lg">
              <Bot className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Choose Game Mode
          </h2>
          <p className="text-muted-foreground mt-1">{levelName}</p>
        </div>
        
        {/* VS AI Section */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Play vs AI
          </h3>
          
          <div className="grid gap-3">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.id}
                onClick={() => onSelectDifficulty(diff.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${diff.borderColor} 
                  bg-background hover:bg-muted/50 transition-all duration-200 
                  active:scale-[0.98] group`}
              >
                <div className={`p-3 rounded-xl ${diff.color} text-white shadow-lg 
                  group-hover:scale-110 transition-transform`}>
                  {diff.icon}
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-bold text-foreground text-lg">{diff.name}</h4>
                  <p className="text-sm text-muted-foreground">{diff.description}</p>
                </div>
                <div className="text-primary font-semibold">Play →</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className="px-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
        
        {/* Solo Mode */}
        <div className="p-6">
          <Button 
            variant="outline" 
            className="w-full h-14 text-lg"
            onClick={onPlaySolo}
          >
            Practice Solo (No Opponent)
          </Button>
        </div>
      </div>
    </div>
  );
};
