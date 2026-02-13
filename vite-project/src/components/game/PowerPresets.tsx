import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface PowerPresetsProps {
  onSelectPower: (power: number) => void;
  disabled: boolean;
  visible: boolean;
}

const PRESETS = [
  { label: 'Light', power: 0.3, color: 'bg-green-500 hover:bg-green-600', emoji: '🍃' },
  { label: 'Medium', power: 0.6, color: 'bg-amber-500 hover:bg-amber-600', emoji: '💨' },
  { label: 'Strong', power: 0.9, color: 'bg-red-500 hover:bg-red-600', emoji: '🔥' },
];

export const PowerPresets = ({ onSelectPower, disabled, visible }: PowerPresetsProps) => {
  if (!visible) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div className="bg-card/95 backdrop-blur rounded-2xl p-4 shadow-xl border border-border">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Zap className="w-4 h-4" />
          <span className="font-medium">Quick Shot</span>
        </div>
        <div className="flex flex-col gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              onClick={() => onSelectPower(preset.power)}
              disabled={disabled}
              className={`${preset.color} text-white font-semibold min-w-[100px] h-12 text-base shadow-lg
                transition-all duration-200 active:scale-95 disabled:opacity-50`}
            >
              <span className="mr-2">{preset.emoji}</span>
              {preset.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Tap marble first, then pick power
        </p>
      </div>
    </div>
  );
};
