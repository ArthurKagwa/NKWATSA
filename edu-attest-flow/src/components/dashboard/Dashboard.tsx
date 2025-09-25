import { useCallback, useEffect, useState } from 'react';
import { Award, Clock, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { dataStore } from '@/lib/storage';
import { sha256Hex } from '@/lib/hash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProgressData {
  course_id: string;
  module_id: string;
  status: string;
  latest_attempt_id: string | null;
  passed_at: string | null;
}

interface AttemptData {
  score_raw: number;
  score_max: number;
  duration_s: number;
  passed: boolean;
}

export function Dashboard() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [proofHash, setProofHash] = useState('');

  const loadDashboardData = useCallback(async (wallet: string) => {
    const [progressData, attemptsData] = await Promise.all([
      dataStore.listProgressByWallet(wallet),
      dataStore.listAttemptsByWallet(wallet)
    ]);

    const normalizedProgress: ProgressData[] = (progressData || []).map((item) => ({
      course_id: item.course_id,
      module_id: item.module_id,
      status: item.status,
      latest_attempt_id: item.latest_attempt_id ?? null,
      passed_at: item.passed_at ?? null
    }));
    setProgress(normalizedProgress);

    const attemptSummaries: AttemptData[] = (attemptsData || []).map((attempt) => ({
      score_raw: attempt.score_raw,
      score_max: attempt.score_max,
      duration_s: attempt.duration_s,
      passed: attempt.passed
    }));
    setAttempts(attemptSummaries);

    if (attemptSummaries.some((attempt) => attempt.passed)) {
      const mockProof = await sha256Hex(`${wallet}-MATH101-readiness`);
      setProofHash(mockProof);
    } else {
      setProofHash('');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProgress([]);
      setAttempts([]);
      setProofHash('');
      return;
    }

    void loadDashboardData(user.wallet);
  }, [user, loadDashboardData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-success text-success-foreground';
      case 'IN_PROGRESS':
        return 'bg-warning text-warning-foreground';
      case 'BENEFIT_CLAIMED':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const latestAttempt = attempts[0];
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter((attempt) => attempt.passed).length;
  const completionRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Welcome,</span>
          <Badge variant="outline" className="wallet-address">
            {user?.wallet.slice(0, 6)}...{user?.wallet.slice(-4)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proofHash ? (
              <>
                <div>
                  <div className="text-sm font-medium text-success mb-2">
                    Mathematics Readiness Completed
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">Proof Hash:</div>
                  <div className="font-mono text-xs p-2 bg-muted rounded border break-all">
                    {proofHash}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" disabled className="w-full">
                    EAS Attestation (Coming Soon)
                  </Button>
                  <Button size="sm" variant="outline" disabled className="w-full">
                    Mint ERC-5192 Badge (Coming Soon)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted-foreground">
                  Complete the readiness quiz to unlock achievements
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.length > 0 ? (
              progress.map((item) => (
                <div key={`${item.course_id}-${item.module_id}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.course_id}</div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Module: {item.module_id}</div>
                  {item.passed_at && (
                    <div className="text-xs text-success">
                      Completed: {new Date(item.passed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-muted-foreground">
                  No progress yet. Start with the readiness quiz!
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {latestAttempt && (
          <Card className="gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Latest Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {latestAttempt.score_raw}/{latestAttempt.score_max}
                  </div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(latestAttempt.duration_s)}</div>
                  <div className="text-xs text-muted-foreground">Time</div>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-semibold ${latestAttempt.passed ? 'text-success' : 'text-error'}`}>
                  {latestAttempt.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Summary Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{totalAttempts}</div>
                <div className="text-xs text-muted-foreground">Total Attempts</div>
              </div>
              <div>
                <div className="text-xl font-bold">{Math.round(completionRate)}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
