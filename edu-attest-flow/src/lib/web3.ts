import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask, injected, coinbaseWallet } from 'wagmi/connectors';

const appMetadata = {
  name: 'NKWATSA AI',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
  iconUrl: 'https://wallet.metamask.io/images/mm-logo.svg'
};

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    metaMask({
      dappMetadata: appMetadata,
      extensionOnly: true,
      preferDesktop: true,
      checkInstallationImmediately: false
    }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: appMetadata.name,
      appLogoUrl: appMetadata.iconUrl,
      preference: 'extension'
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
});

