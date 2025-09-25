import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import { dataStore } from '@/lib/storage';
import { toast } from 'sonner';

interface BenefitClaim {
  claim_code: string;
  benefit_id: string;
  created_at: string;
}

export function BenefitsGate() {
  const { user } = useAuth();
  const [isEligible, setIsEligible] = useState(false);
  const [claimCode, setClaimCode] = useState<string>('');
  const [existingClaims, setExistingClaims] = useState<BenefitClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const checkEligibility = useCallback(async (wallet: string) => {
    const progress = await dataStore.getProgressRecord(wallet, 'MATH101', 'readiness');
    setIsEligible(!!progress && (progress.status === 'READY' || progress.status === 'BENEFIT_CLAIMED'));
  }, []);

  const loadExistingClaims = useCallback(async (wallet: string) => {
    const claims = await dataStore.listBenefitClaims(wallet);
    setExistingClaims(claims as BenefitClaim[]);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsEligible(false);
      setExistingClaims([]);
      return;
    }

    void (async () => {
      await checkEligibility(user.wallet);
      await loadExistingClaims(user.wallet);
    })();
  }, [user, checkEligibility, loadExistingClaims]);

  const handleClaimBenefit = async () => {
    if (!user || !isEligible) return;

    setIsLoading(true);
    try {
      const result = await apiClient.grantBenefit({
        learner_addr: user.wallet,
        benefit_id: 'study-trip-2024'
      });

      setClaimCode(result.claim_code);
      toast.success('Benefit claim code generated!');

      await checkEligibility(user.wallet);
      await loadExistingClaims(user.wallet);
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim benefit');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Benefits Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connect your wallet to access benefits</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Benefits Portal</h1>
        <Badge variant="outline" className="wallet-address">
          {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
        </Badge>
      </div>

      <Card className="gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Educational Study Trip 2024
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Trip Details</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>- Silicon Valley Tech Tour</li>
                <li>- MIT & Harvard Campus Visits</li>
                <li>- All expenses covered</li>
                <li>- 7 days, premium accommodations</li>
                <li>- Networking with industry leaders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Eligibility Requirements</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isEligible ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-sm">Complete Mathematics Readiness Quiz (8/10 minimum)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Verified wallet connection</span>
                </div>
              </div>
            </div>
          </div>

          {isEligible ? (
            <div className="space-y-4">
              {claimCode ? (
                <Card className="bg-success/10 border-success/20">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-3">
                      <CheckCircle className="h-8 w-8 text-success mx-auto" />
                      <div>
                        <h3 className="font-semibold text-success">Benefit Claimed Successfully!</h3>
                        <p className="text-sm text-muted-foreground mt-1">Your claim code has been generated</p>
                      </div>
                      <div className="bg-background p-3 rounded border">
                        <div className="text-xs text-muted-foreground mb-1">Claim Code:</div>
                        <div className="font-mono text-lg font-bold tracking-wider">{claimCode}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">Save this code and present it to claim your benefit</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button onClick={handleClaimBenefit} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? 'Generating Claim Code...' : 'Claim Educational Trip Benefit'}
                </Button>
              )}
            </div>
          ) : (
            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-warning mx-auto" />
                  <h3 className="font-semibold">Complete Readiness Quiz First</h3>
                  <p className="text-sm text-muted-foreground">
                    You need to pass the Mathematics Readiness Quiz with at least 8/10 correct answers to unlock this benefit.
                  </p>
                  <Button variant="outline" asChild className="mt-3">
                    <a href="/quiz">Take Readiness Quiz</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {existingClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Benefit Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingClaims.map((claim) => (
                <Card key={claim.claim_code} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Educational Study Trip 2024</div>
                      <div className="text-sm text-muted-foreground">
                        Claimed: {new Date(claim.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {claim.claim_code}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
