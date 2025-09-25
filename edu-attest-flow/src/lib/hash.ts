export async function sha256Hex(input: string): Promise<string> {
  const crypto = globalThis.crypto;

  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }

  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
