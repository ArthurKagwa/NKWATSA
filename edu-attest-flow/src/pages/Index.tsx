import { useState } from 'react';
import { WalletConnect } from '@/components/ui/wallet-connect';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ReadinessQuiz } from '@/components/quiz/ReadinessQuiz';
import { BenefitsGate } from '@/components/benefits/BenefitsGate';
import { Navbar } from '@/components/navigation/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Shield, Zap } from 'lucide-react';

const Index = () => {
  const renderPlaceholder = (title: string, description: string, items?: string[]) => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-muted-foreground">
        <p>{description}</p>
        {items && items.length > 0 && (
          <ul className="list-disc list-inside space-y-1">
            {items.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 pt-20">
            <div className="flex items-center justify-center mb-6">
              <div className="gradient-primary p-4 rounded-full shadow-glow">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              NKWATSA AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Web3-powered education platform with verifiable achievements, role-based access control, and real benefits for learning progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-primary text-white font-semibold px-8 py-3 rounded-full shadow-glow hover:scale-105 transition-transform"
                onClick={() => document.getElementById('wallet-connect-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started - Access Dashboard
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 rounded-full"
                onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features-section" className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="gradient-card shadow-card text-center">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Sign In with Ethereum</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Secure wallet-based authentication with role-based permissions for learners, tutors, and administrators.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card shadow-card text-center">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Verifiable Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Complete assessments, earn cryptographic proofs, and unlock real-world benefits through verified achievements.
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card shadow-card text-center">
              <CardHeader>
                <GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Smart Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Gate access to trips, discounts, and perks based on verifiable learning milestones and checkpoint completion.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Connection Section */}
          <div id="wallet-connect-section" className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">Ready to Start Learning?</h2>
              <p className="text-muted-foreground">
                Connect your wallet to access your personal dashboard, take quizzes, and earn verifiable achievements.
              </p>
            </div>
            <WalletConnect />
            
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Demo Accounts</h3>
              <div className="text-xs space-y-1 text-muted-foreground mb-3">
                <div>Learner: 0x53E5...d94 (Alice)</div>
                <div>Tutor: 0xfc34...b88 (Bob)</div>
                <div>Benefits Admin: 0x5fc2...4b (Carol)</div>
                <div>System: 0xEE2D...01 (Bot)</div>
                <div>Platform Admin: 0x474c...90 (Admin)</div>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2">
                <p className="font-medium mb-1">💡 MetaMask Setup Tips:</p>
                <ul className="space-y-1 pl-2">
                  <li>• Allow popups for this site</li>
                  <li>• Ensure MetaMask is unlocked</li>
                  <li>• Use Chrome/Firefox for best results</li>
                  <li>• If Core Wallet appears, disable it or set MetaMask as default</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'quiz':
        return <ReadinessQuiz />;
      case 'benefits':
        return <BenefitsGate />;
      case 'courses':
        return renderPlaceholder(
          'Course Builder',
          'Design and launch new courses with modules and readiness checkpoints. This workspace will let tutors assemble structured learning paths and publish them to learners.',
          ['Create course outlines with metadata', 'Attach quiz blueprints and checkpoints', 'Preview learner experience before publishing']
        );
      case 'checkpoints':
        return renderPlaceholder(
          'Checkpoint Manager',
          'Configure module checkpoints, passing rules, and readiness requirements for each course.',
          ['Define passing thresholds and timers', 'Review quiz question pools', 'Toggle activation for each cohort']
        );
      case 'analytics':
        return renderPlaceholder(
          'Learner Analytics',
          'Track learner progress, quiz performance, and attestation history once telemetry is connected.',
          ['Progress funnels per cohort', 'Attempts and score distribution', 'Export-ready insights for benefits partners']
        );
      case 'validate':
        return renderPlaceholder(
          'Proof Validation',
          'Verify learner attestations before granting program benefits.',
          ['Scan proof hashes and signatures', 'Confirm wallet ownership', 'Log validation outcomes for auditing']
        );
      case 'claims':
        return renderPlaceholder(
          'Claim Code Issuance',
          'Generate and distribute one-time claim codes for eligible learners.',
          ['Bulk generate codes with expiry windows', 'Assign benefits by course/module', 'Track which learner redeems each code']
        );
      case 'redemptions':
        return renderPlaceholder(
          'Redemption Tracker',
          'Monitor how benefits are redeemed across programs and cohorts.',
          ['View redemption status and timestamps', 'Identify high-value learners', 'Export reports for finance reconciliation']
        );
      case 'users':
        return renderPlaceholder(
          'User & Role Administration',
          'Manage wallets, roles, and access policies across the platform.',
          ['Invite new team members', 'Assign or revoke roles', 'Review recent sign-ins and access events']
        );
      case 'health':
        return renderPlaceholder(
          'System Health',
          'Keep an eye on service uptime, API throughput, and queue depths.',
          ['Realtime status of core services', 'Latest incidents and mitigations', 'Upcoming maintenance windows']
        );
      case 'schemas':
        return renderPlaceholder(
          'Attestation Schemas',
          'Review and edit the schemas used to issue on-chain attestations.',
          ['Version and publish schema updates', 'Preview encoded payloads', 'Link schemas to issuing workflows']
        );
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 p-4 min-h-screen">
          <Navbar currentView={currentView} onViewChange={setCurrentView} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;



