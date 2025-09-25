import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface StudentRegistrationProps {
  onComplete?: () => void;
}

export function StudentRegistration({ onComplete }: StudentRegistrationProps) {
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useAuth();

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsRegistering(true);
    try {
      // The registration happens automatically in auth-client.ts when a new user signs in
      // This component is more for collecting additional profile information
      toast.success('Welcome! You are now registered as a student');
      onComplete?.();
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // If user is already registered, show completion message
  if (user && user.roles.includes('LEARNER')) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="gradient-card shadow-card">
          <CardHeader className="text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />
            <CardTitle>Welcome, Student!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You are successfully registered as a student. You can now:
            </p>
            <ul className="text-sm text-left space-y-2 bg-muted p-4 rounded-lg">
              <li>• Browse and enroll in available courses</li>
              <li>• Take quizzes and assessments</li>
              <li>• Track your learning progress</li>
              <li>• Earn verifiable achievements</li>
              <li>• Claim benefits for completed milestones</li>
            </ul>
            <div className="text-sm text-muted-foreground">
              Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
            </div>
            <Button 
              onClick={onComplete}
              className="w-full"
            >
              Continue to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="gradient-card shadow-card">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>Register as Student</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Complete your registration to access courses and start learning
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="text-sm font-medium">What you'll get access to:</div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Browse available courses</li>
                <li>• Enroll in courses that interest you</li>
                <li>• Take quizzes and earn achievements</li>
                <li>• Track your learning progress</li>
                <li>• Claim real-world benefits</li>
              </ul>
            </div>

            {user && (
              <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
                <strong>Connected Wallet:</strong><br />
                {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
              </div>
            )}

            <Button
              onClick={handleRegister}
              disabled={isRegistering || !user}
              className="w-full"
            >
              {isRegistering ? 'Registering...' : 'Complete Registration'}
            </Button>

            {!user && (
              <div className="text-xs text-muted-foreground text-center">
                Please connect your wallet first to register
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}