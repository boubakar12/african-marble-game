import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useGameStore } from '@/store/gameStore';
import { 
  Circle, 
  Lock, 
  Unlock, 
  Target, 
  Triangle, 
  CircleDot,
  Trophy,
  Crosshair,
  Zap,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const { 
    marbleCount, 
    level1Completions, 
    level2Completions, 
    level3Completions,
    totalMarblesWon,
    totalMarblesLost,
    totalShots 
  } = useGameStore();

  const levels = [
    {
      id: 1,
      name: 'Hole Challenge',
      description: 'Get your marble in the hole to win!',
      icon: Target,
      reward: '+1 marble',
      risk: 'No risk - practice mode',
      gradient: 'level-card-1',
      unlocked: true,
      completions: level1Completions,
      path: '/level/1',
    },
    {
      id: 2,
      name: 'Triangle Formation',
      description: 'Knock all 3 marbles outside the triangle!',
      icon: Triangle,
      reward: '+3 marbles',
      risk: '-1 marble if you lose',
      gradient: 'level-card-2',
      unlocked: marbleCount >= 1,
      completions: level2Completions,
      path: '/level/2',
    },
    {
      id: 3,
      name: 'Circle & Cross',
      description: 'Knock all 4 marbles outside the circle!',
      icon: CircleDot,
      reward: '+4 marbles',
      risk: '-1 marble + return won marbles',
      gradient: 'level-card-3',
      unlocked: marbleCount >= 1,
      completions: level3Completions,
      path: '/level/3',
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Circle className="w-24 h-24 text-primary fill-gold animate-float" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gold-light to-gold opacity-80" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            African Marble Game
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the traditional marble game played by children across African villages. 
            Master the art of aim and precision!
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gold/20 border-gold/50">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto text-gold mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalMarblesWon}</p>
              <p className="text-sm text-muted-foreground">Marbles Won</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 text-center">
              <Circle className="w-8 h-8 mx-auto text-destructive mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalMarblesLost}</p>
              <p className="text-sm text-muted-foreground">Marbles Lost</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/20 border-accent/30">
            <CardContent className="p-4 text-center">
              <Crosshair className="w-8 h-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalShots}</p>
              <p className="text-sm text-muted-foreground">Total Shots</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-4 text-center">
              <History className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {level1Completions + level2Completions + level3Completions}
              </p>
              <p className="text-sm text-muted-foreground">Levels Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Level Selection */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-gold" />
            Choose Your Challenge
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {levels.map((level) => (
              <Card 
                key={level.id}
                className={`
                  relative overflow-hidden transition-all duration-300
                  ${level.unlocked 
                    ? 'hover:scale-105 hover:shadow-xl cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                <div className={`absolute inset-0 ${level.gradient} opacity-90`} />
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <level.icon className="w-12 h-12 text-white/90" />
                    {level.unlocked ? (
                      <Unlock className="w-6 h-6 text-white/80" />
                    ) : (
                      <Lock className="w-6 h-6 text-white/80" />
                    )}
                  </div>
                  <CardTitle className="text-white text-xl">
                    Level {level.id}: {level.name}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {level.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="bg-white/20 rounded-lg p-3 text-white text-sm">
                    <p className="font-semibold text-green-200">🏆 {level.reward}</p>
                    <p className="text-red-200">⚠️ {level.risk}</p>
                  </div>
                  <div className="text-white/70 text-sm">
                    Completed: {level.completions} times
                  </div>
                  {level.unlocked ? (
                    <Link to={level.path}>
                      <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30">
                        Play Now
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full bg-white/10 text-white/50">
                      Need 1+ marble to unlock
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cultural Heritage Section */}
        <Card className="bg-sand-light/50 border-earth/30">
          <CardHeader>
            <CardTitle className="text-earth flex items-center gap-2">
              <Circle className="w-6 h-6 fill-earth" />
              Cultural Heritage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              <strong>The African Marble Game</strong> is a beloved traditional pastime that has been 
              played across the African continent for generations. Children would gather in village 
              courtyards, drawing circles and triangles in the sandy ground with sticks.
            </p>
            <p>
              The game teaches valuable skills: <strong>hand-eye coordination</strong>, 
              <strong> strategic thinking</strong>, <strong> physics understanding</strong>, and 
              <strong> patience</strong>. Players learn to calculate angles, judge distances, and 
              apply the right amount of force.
            </p>
            <p>
              In many communities, marbles were prized possessions. Winning marbles meant prestige 
              and skill. This digital version preserves these authentic rules while making the 
              experience accessible to players worldwide.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['🌍 Africa', '🎯 Precision', '🧠 Strategy', '👨‍👩‍👧‍👦 Community', '🏆 Competition'].map(tag => (
                <span 
                  key={tag} 
                  className="bg-earth/10 text-earth px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HomePage;
