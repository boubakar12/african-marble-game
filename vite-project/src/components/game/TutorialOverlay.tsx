import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Target, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: <Target className="w-12 h-12 text-primary" />,
    title: "Aim Your Shot",
    description: "Tap and drag backwards from your marble (dark one) to aim. The further you drag, the more power!",
    highlight: "Drag backwards to aim",
  },
  {
    icon: <Zap className="w-12 h-12 text-gold" />,
    title: "Choose Your Power",
    description: "Use the power presets at the bottom for quick shots, or drag for precise control. Green = light, Yellow = medium, Red = strong!",
    highlight: "Power presets help!",
  },
  {
    icon: <Trophy className="w-12 h-12 text-green-500" />,
    title: "Win the Game",
    description: "Knock all colored marbles outside the boundary. But be careful - your shooter marble must stay outside too!",
    highlight: "Keep shooter safe!",
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const TutorialOverlay = ({ isOpen, onClose, onComplete }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(s => s - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-primary/10 p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-background/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex justify-center mb-3">
            {step.icon}
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {step.title}
          </h2>
          <div className="mt-2 inline-block bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {step.highlight}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-muted-foreground text-center text-lg leading-relaxed">
            {step.description}
          </p>
          
          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {TUTORIAL_STEPS.map((_, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-border flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleNext}
          >
            {isLastStep ? "Let's Play!" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
