import { Circle, Trophy } from 'lucide-react';

interface MarbleCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export const MarbleCounter = ({ count, size = 'md' }: MarbleCounterProps) => {
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={`flex items-center gap-2 bg-gold/90 text-earth rounded-full font-bold 
                  shadow-lg ${sizeClasses[size]} animate-pulse-glow`}
    >
      <Trophy className={iconSizes[size]} />
      <span>{count}</span>
      <Circle className={`${iconSizes[size]} fill-marble-shooter`} />
    </div>
  );
};
