import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Trophy, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StudentWelcomeProps {
  onGetStarted: () => void;
}

export function StudentWelcome({ onGetStarted }: StudentWelcomeProps) {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="gradient-primary p-4 rounded-full shadow-glow">
            <GraduationCap className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Welcome to NKWATSA AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          You're now registered as a student! Start your learning journey with verifiable achievements and real-world benefits.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="gradient-card shadow-card text-center">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Browse Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore available courses and enroll in subjects that interest you.
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card text-center">
          <CardHeader>
            <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Take Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Complete assessments to demonstrate your knowledge and progress.
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card text-center">
          <CardHeader>
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Earn Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get verifiable, cryptographic proofs of your learning milestones.
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card text-center">
          <CardHeader>
            <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Claim Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unlock real-world perks and opportunities based on your progress.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="text-center">Your Student Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Wallet Address:</strong>
                <div className="font-mono text-muted-foreground">
                  {user?.wallet.slice(0, 6)}...{user?.wallet.slice(-4)}
                </div>
              </div>
              <div>
                <strong>Role:</strong>
                <div className="text-muted-foreground">
                  Student (LEARNER)
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="gradient-primary text-white font-semibold px-8 py-3 rounded-full shadow-glow hover:scale-105 transition-transform"
            >
              Start Browsing Courses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}