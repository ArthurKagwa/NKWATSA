'use client';

import { useState } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  isMetaMaskInstalled,
  requestMetaMaskConnection,
  formatMetaMaskError,
  prepareForMetaMaskPopup,
  isCoreWalletInterfering
} from '@/lib/metamask';

export function WalletConnect() {
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { user, signIn, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const isBrowser = typeof window !== 'undefined';

  const handleConnect = async (connector: Connector) => {
    setConnectingId(connector.id);

    try {
      if (connector.id === 'metaMask') {
        if (!isMetaMaskInstalled()) {
          toast.error('MetaMask extension not detected. Install it to continue.');
          if (isBrowser) {
          window.open('https://metamask.io/download.html', '_blank');
        }
          return;
        }

        if (isCoreWalletInterfering()) {
          toast.error('Core Wallet is taking over the injected provider. Disable it or choose a different connector.');
          return;
        }

        prepareForMetaMaskPopup();
        await requestMetaMaskConnection();
      }

      await connectAsync({ connector });
      toast.success(`${connector.name} connected successfully!`);
    } catch (error) {
      console.error('Wallet connection error:', error);

      if (connector.id === 'metaMask') {
        toast.error(formatMetaMaskError(error));
      } else {
        const message =
          (error as { shortMessage?: string; message?: string })?.shortMessage ??
          (error as Error)?.message ??
          'Failed to connect wallet.';
        toast.error(message);
      }
    } finally {
      setConnectingId(null);
    }
  };

  const handleSignIn = async () => {
    if (!address) return;

    setIsSigningIn(true);
    try {
      const domain = window.location.host;
      const origin = window.location.origin;
      const nonce = Math.random().toString(36).substring(2, 15);

      const message = new SiweMessage({
        domain,
        address,
        statement: 'Sign in to NKWATSA AI with Ethereum.',
        uri: origin,
        version: '1',
        chainId: 1,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const messageText = message.prepareMessage();
      const signature = await signMessageAsync({
        account: address,
        message: messageText
      });

      const success = await signIn(address, signature, messageText);

      if (success) {
        toast.success('Successfully signed in!');
      } else {
        toast.error('Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Sign in failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    disconnect();
    toast.success('Signed out');
  };

  if (user && isConnected && address) {
    return (
      <Card className="gradient-card shadow-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="wallet-address text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="text-sm text-muted-foreground">
            Roles: {user.roles.join(', ')}
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && address) {
    return (
      <Card className="gradient-card shadow-card border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="wallet-address text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex-1"
            >
              {isSigningIn ? 'Signing In...' : 'Sign In with Ethereum'}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="icon"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const noConnectorsAvailable = connectors.length === 0;
  const hasReadyConnector = connectors.some((connector) => connector.ready);

  return (
    <Card className="gradient-card shadow-card border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {connectors.map((connector) => {
            const disabled = connectingId === connector.id;
            const isConnecting = connectingId === connector.id;

            return (
              <div key={connector.id} className="space-y-1">
                <Button
                  onClick={() => handleConnect(connector)}
                  className="w-full justify-start"
                  variant={connector.ready ? 'default' : 'outline'}
                  disabled={disabled}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {connector.ready
                    ? isConnecting
                      ? `Connecting ${connector.name}...`
                      : `Connect ${connector.name}`
                    : `Connect ${connector.name}`}
                </Button>
                {!connector.ready && (
                  <p className="pl-8 text-xs text-muted-foreground">
                    {`Install or enable ${connector.name} to continue.`}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!hasReadyConnector && !noConnectorsAvailable && (
          <div className="text-xs text-muted-foreground text-center">
            We couldn't detect a browser wallet extension. Try the buttons above or install one to continue.
          </div>
        )}

        {noConnectorsAvailable && (
          <div className="text-xs text-muted-foreground text-center">
            No wallet connectors available. Install a wallet extension to continue.
          </div>
        )}

        {isBrowser && !isMetaMaskInstalled() && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://metamask.io/download.html', '_blank')}
            className="w-full"
          >
            Install MetaMask
          </Button>
        )}

        <div className="text-xs text-muted-foreground text-center">
          <p>Choose a wallet to connect. Make sure your extension is unlocked and popups are allowed.</p>
          {isBrowser && isCoreWalletInterfering() && (
            <p className="text-warning mt-1">Core Wallet detected. Disable it or pick another connector.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}








