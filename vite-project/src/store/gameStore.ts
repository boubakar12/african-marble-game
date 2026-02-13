import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameProgress {
  marbleCount: number;
  level1Completions: number;
  level2Completions: number;
  level3Completions: number;
  totalMarblesWon: number;
  totalMarblesLost: number;
  totalShots: number;
}

interface GameStore extends GameProgress {
  // Actions
  addMarbles: (count: number) => void;
  removeMarbles: (count: number) => void;
  recordShot: () => void;
  completeLevel: (level: 1 | 2 | 3) => void;
  recordWin: (marbles: number) => void;
  recordLoss: (marbles: number) => void;
  resetProgress: () => void;
}

const initialState: GameProgress = {
  marbleCount: 0,
  level1Completions: 0,
  level2Completions: 0,
  level3Completions: 0,
  totalMarblesWon: 0,
  totalMarblesLost: 0,
  totalShots: 0,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      addMarbles: (count) => 
        set((state) => ({ 
          marbleCount: state.marbleCount + count,
          totalMarblesWon: state.totalMarblesWon + count,
        })),
      
      removeMarbles: (count) => 
        set((state) => ({ 
          marbleCount: Math.max(0, state.marbleCount - count),
          totalMarblesLost: state.totalMarblesLost + count,
        })),
      
      recordShot: () => 
        set((state) => ({ totalShots: state.totalShots + 1 })),
      
      completeLevel: (level) => 
        set((state) => {
          const key = `level${level}Completions` as keyof GameProgress;
          return { [key]: (state[key] as number) + 1 };
        }),
      
      recordWin: (marbles) => 
        set((state) => ({
          marbleCount: state.marbleCount + marbles,
          totalMarblesWon: state.totalMarblesWon + marbles,
        })),
      
      recordLoss: (marbles) => 
        set((state) => ({
          marbleCount: Math.max(0, state.marbleCount - marbles),
          totalMarblesLost: state.totalMarblesLost + marbles,
        })),
      
      resetProgress: () => set(initialState),
    }),
    {
      name: 'african-marble-game-storage',
    }
  )
);
