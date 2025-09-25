import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { useDisconnect } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Trophy,
  Gift,
  Settings,
  Users,
  BarChart3,
  Database,
  Shield,
  LogOut,
  Bot
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  const { user, hasRole, signOut } = useAuth();
  const { disconnect } = useDisconnect();

  if (!user) return null;

  const learnerItems = [
    { id: 'tutor', label: 'AI Tutor', icon: Bot },
    { id: 'courses', label: 'Browse Courses', icon: BookOpen },
    { id: 'quiz', label: 'Start Quiz', icon: BookOpen },
    { id: 'dashboard', label: 'My Achievements', icon: Trophy },
    { id: 'benefits', label: 'Claim Benefits', icon: Gift }
  ];

  const tutorItems = [
    { id: 'course-builder', label: 'Create Course', icon: BookOpen },
    { id: 'checkpoints', label: 'Checkpoints', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const benefitsAdminItems = [
    { id: 'validate', label: 'Validate Proof', icon: Shield },
    { id: 'claims', label: 'Issue Claim Code', icon: Gift },
    { id: 'redemptions', label: 'Redemptions', icon: BarChart3 }
  ];

  const platformAdminItems = [
    { id: 'users', label: 'User Roles', icon: Users },
    { id: 'health', label: 'System Health', icon: BarChart3 },
    { id: 'schemas', label: 'Schemas', icon: Database }
  ];

  const getMenuItems = () => {
    const items = [];
    
    if (hasRole('LEARNER')) {
      items.push(...learnerItems);
    }
    
    if (hasRole('TUTOR')) {
      items.push(...tutorItems);
    }
    
    if (hasRole('BENEFITS_ADMIN')) {
      items.push(...benefitsAdminItems);
    }
    
    if (hasRole('PLATFORM_ADMIN')) {
      items.push(...platformAdminItems);
    }
    
    return items;
  };

  const menuItems = getMenuItems();

  const handleSignOut = () => {
    signOut();
    disconnect();
    toast.success('Signed out');
  };

  return (
    <Card className="gradient-card shadow-card border-card-border p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">NKWATSA AI</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Roles:</span>
            {user.roles.map(role => (
              <Badge key={role} variant="secondary" className="text-xs">
                {role.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>
        <Badge variant="outline" className="wallet-address">
          {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
        </Badge>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="pt-6 mt-6 border-t border-border/60">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </Card>
  );
}




