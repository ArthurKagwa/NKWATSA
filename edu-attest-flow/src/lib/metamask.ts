/**
 * MetaMask utility functions for enhanced popup and connection handling
 */

export interface MetaMaskError {
  code: number;
  message: string;
}

export const MetaMaskErrorCodes = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  REQUEST_PENDING: -32002,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if there's a proper MetaMask provider
  if (window.ethereum?.isMetaMask === true) {
    return true;
  }
  
  // Check for multiple providers (when multiple wallets are installed)
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers.some((provider: any) => provider.isMetaMask === true);
  }
  
  return false;
}

/**
 * Check if Core Wallet is interfering with MetaMask
 */
export function isCoreWalletInterfering(): boolean {
  if (typeof window === 'undefined') return false;
  
  // If the main provider is Core Wallet
  if (window.ethereum?.isCore === true) {
    return true;
  }
  
  // If Core Wallet is present but MetaMask is not the main provider
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    const hasCore = window.ethereum.providers.some((provider: any) => provider.isCore === true);
    const hasMetaMask = window.ethereum.providers.some((provider: any) => provider.isMetaMask === true);
    
    // If Core is present and either MetaMask is not present, or the main provider is not MetaMask
    return hasCore && (!hasMetaMask || window.ethereum?.isMetaMask !== true);
  }
  
  return false;
}

/**
 * Get the MetaMask provider specifically
 */
export function getMetaMaskProvider(): any {
  if (typeof window === 'undefined') return null;
  
  // If the main provider is MetaMask
  if (window.ethereum?.isMetaMask === true) {
    return window.ethereum;
  }
  
  // Look for MetaMask in providers array
  if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
    return window.ethereum.providers.find((provider: any) => provider.isMetaMask === true);
  }
  
  return null;
}

/**
 * Check if MetaMask is locked (requires user interaction)
 */
export async function isMetaMaskLocked(): Promise<boolean> {
  if (!isMetaMaskInstalled()) return true;
  
  try {
    const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
    return !accounts || accounts.length === 0;
  } catch {
    return true;
  }
}

/**
 * Request MetaMask to show popup for account connection
 */
export async function requestMetaMaskConnection(): Promise<string[]> {
  const metamaskProvider = getMetaMaskProvider();
  
  if (!metamaskProvider) {
    throw new Error('MetaMask is not installed or not available');
  }

  // Focus the window to ensure popup visibility
  if (typeof window !== 'undefined') {
    window.focus();
  }

  try {
    // First try wallet_requestPermissions (shows popup) on the specific MetaMask provider
    await metamaskProvider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    });
  } catch (error: any) {
    const code = error?.code;
    
    if (code === MetaMaskErrorCodes.USER_REJECTED) {
      throw new Error('Connection rejected by user');
    } else if (code === MetaMaskErrorCodes.REQUEST_PENDING) {
      throw new Error('Connection request already pending. Please check your MetaMask extension.');
    }
    
    // Fallback to eth_requestAccounts on the specific provider
    try {
      return await metamaskProvider.request({ method: 'eth_requestAccounts' });
    } catch (fallbackError: any) {
      if (fallbackError?.code === MetaMaskErrorCodes.USER_REJECTED) {
        throw new Error('Connection rejected by user');
      }
      throw fallbackError;
    }
  }

  // Get accounts after permission granted from the specific provider
  return await metamaskProvider.request({ method: 'eth_accounts' });
}

/**
 * Format MetaMask error messages for user display
 */
export function formatMetaMaskError(error: any): string {
  const code = error?.code;
  
  switch (code) {
    case MetaMaskErrorCodes.USER_REJECTED:
      return 'Connection was rejected. Please accept the MetaMask connection request.';
    case MetaMaskErrorCodes.UNAUTHORIZED:
      return 'Unauthorized. Please connect your MetaMask wallet.';
    case MetaMaskErrorCodes.REQUEST_PENDING:
      return 'Connection request is already pending. Please check your MetaMask extension.';
    case MetaMaskErrorCodes.DISCONNECTED:
      return 'MetaMask is disconnected. Please check your internet connection.';
    case MetaMaskErrorCodes.CHAIN_DISCONNECTED:
      return 'Network is disconnected. Please check your network connection.';
    default:
      return error?.message || 'An unexpected error occurred with MetaMask.';
  }
}

/**
 * Ensure popup blockers don't prevent MetaMask from showing
 */
export function prepareForMetaMaskPopup(): void {
  if (typeof window === 'undefined') return;
  
  // Focus the current window
  window.focus();
  
  // Clear any existing focus traps
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();
  }
}