interface PowerMeterProps {
  power: number; // 0 to 1
  visible: boolean;
}

export const PowerMeter = ({ power, visible }: PowerMeterProps) => {
  if (!visible) return null;

  const getColor = () => {
    if (power < 0.33) return 'bg-green-500';
    if (power < 0.66) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const height = Math.min(power * 100, 100);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
      <div className="w-6 h-32 bg-muted/80 rounded-full border-2 border-border overflow-hidden shadow-lg">
        <div className="w-full h-full flex flex-col-reverse">
          <div 
            className={`w-full transition-all duration-100 ${getColor()} rounded-full`}
            style={{ height: `${height}%` }}
          />
        </div>
      </div>
      <div className="text-center mt-2 text-sm font-bold text-foreground">
        {Math.round(power * 100)}%
      </div>
    </div>
  );
};
