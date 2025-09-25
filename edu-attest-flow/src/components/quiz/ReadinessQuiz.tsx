import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface QuizItem {
  id: string;
  stem: string;
  answer_format: string;
}

interface Quiz {
  quiz_id: string;
  items: QuizItem[];
  expires_at: string;
}

interface ReadinessQuizProps {
  isUnlocked?: boolean;
  onNavigateToTutor?: () => void;
}

export function ReadinessQuiz({ isUnlocked = true, onNavigateToTutor }: ReadinessQuizProps) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isSubmitted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [isStarted, isSubmitted, timeLeft]);

  const startQuiz = async () => {
    if (!isUnlocked) {
      toast.info('Complete the AI tutor warm-up before starting the readiness quiz.');
      onNavigateToTutor?.();
      return;
    }

    if (!user) return;
    
    try {
      const quizData = await apiClient.generateQuiz({
        course_id: 'MATH101',
        module_id: 'readiness',
        count: 10,
        difficulty: 'easy'
      });
      
      setQuiz(quizData);
      setIsStarted(true);
      setStartTime(new Date().toISOString());
      toast.success('Quiz started! You have 3 minutes.');
    } catch (error) {
      toast.error('Failed to start quiz');
      console.error(error);
    }
  };

  const handleAnswer = (itemId: string, answer: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [itemId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;
    
    setIsSubmitted(true);
    const submittedAt = new Date().toISOString();
    
    try {
      // Score attempt
      const scoreResult = await apiClient.scoreAttempt({
        quiz_id: quiz.quiz_id,
        answers: Object.entries(answers).map(([id, value]) => ({ id, value })),
        started_at: startTime,
        submitted_at: submittedAt
      });
      
      // Update progress
      await apiClient.updateProgress({
        learner_addr: user.wallet,
        course_id: 'MATH101',
        module_id: 'readiness',
        attempt_id: scoreResult.attempt_id,
        passed: scoreResult.passed
      });
      
      // Issue attestation if passed
      if (scoreResult.passed) {
        const attestation = await apiClient.issueAttestation({
          learner_addr: user.wallet,
          course_id: 'MATH101',
          module_id: 'readiness',
          score_pct: (scoreResult.score_raw / scoreResult.score_max) * 100,
          passed_at: submittedAt
        });
        
        setResult({ ...scoreResult, attestation });
      } else {
        setResult(scoreResult);
      }
      
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit quiz');
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (result) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.passed ? (
              <CheckCircle className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-error" />
            )}
            Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {result.score_raw}/{result.score_max}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(result.duration_s)}</div>
              <div className="text-sm text-muted-foreground">Time Taken</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-semibold ${result.passed ? 'text-success' : 'text-error'}`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
            <div className="text-sm text-muted-foreground">
              {result.passed ? 'Congratulations! You can now claim benefits.' : 'Try again to improve your score.'}
            </div>
          </div>

          {result.attestation && (
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <div className="text-sm font-medium mb-2">Achievement Proof</div>
                <div className="font-mono text-xs break-all text-muted-foreground">
                  {result.attestation.proof_hash}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" disabled>
                    EAS Attestation (Coming Soon)
                  </Button>
                  <Button size="sm" disabled>
                    Mint SBT Badge (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Button onClick={() => window.location.reload()} className="w-full">
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Mathematics Readiness Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground space-y-2">
            <p>• 10 questions about multiples of 2</p>
            <p>• 3 minutes time limit</p>
            <p>• Pass with 8/10 correct answers</p>
            <p>• Unlock benefits upon completion</p>
          </div>
          {!isUnlocked && (
            <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
              Complete the AI tutor warm-up to unlock the readiness quiz. The tutor will guide you through practice questions.
            </div>
          )}
          <Button onClick={startQuiz} className="w-full" disabled={!user || !isUnlocked}>
            {!user ? 'Connect Wallet to Start' : isUnlocked ? 'Start Quiz' : 'Quiz Locked'}
          </Button>
          {!isUnlocked && onNavigateToTutor && (
            <Button variant="outline" className="w-full" onClick={onNavigateToTutor}>
              Go to AI Tutor
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!quiz) return null;

  const progress = (Object.keys(answers).length / quiz.items.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Readiness Quiz</span>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className={timeLeft < 30 ? 'text-error' : ''}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </CardTitle>
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-muted-foreground">
          {Object.keys(answers).length} of {quiz.items.length} answered
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quiz.items.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="space-y-3">
              <div className="font-medium">
                {index + 1}. {item.stem}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={answers[item.id] === true ? 'default' : 'outline'}
                  onClick={() => handleAnswer(item.id, true)}
                  className="flex-1"
                >
                  Yes
                </Button>
                <Button
                  variant={answers[item.id] === false ? 'default' : 'outline'}
                  onClick={() => handleAnswer(item.id, false)}
                  className="flex-1"
                >
                  No
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={Object.keys(answers).length !== quiz.items.length}
        >
          Submit Quiz
        </Button>
      </CardContent>
    </Card>
  );
}
