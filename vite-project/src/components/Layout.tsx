import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Circle, Home, Trophy } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { MarbleCounter } from './MarbleCounter';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { marbleCount } = useGameStore();
  
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background african-pattern">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-earth-light shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Circle 
                className="w-10 h-10 text-primary-foreground fill-gold group-hover:animate-spin" 
                style={{ animationDuration: '2s' }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-light to-gold opacity-80" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground tracking-wide">
                African Marble
              </h1>
              <p className="text-xs text-primary-foreground/80">Traditional Game</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <MarbleCounter count={marbleCount} />
            
            {!isHome && (
              <Link 
                to="/"
                className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 
                         text-primary-foreground px-4 py-2 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-earth text-primary-foreground py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="font-semibold">Preserving African Heritage</span>
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <p className="text-sm text-primary-foreground/70">
            A traditional marble game played by children across African villages for generations.
          </p>
        </div>
      </footer>
    </div>
  );
};
