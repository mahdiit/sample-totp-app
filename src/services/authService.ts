// Security / login state. Secrets (accounts) are already encrypted; this gate
// protects access to the app itself via biometric (WebAuthn) or a PIN.

const SECURITY_KEY = 'authenticator_security';

interface SecurityConfig {
  hasPin: boolean;
  pinHash: string | null;
  hasBiometric: boolean;
  credentialId: string | null; // base64url WebAuthn credential id
}

const EMPTY_CONFIG: SecurityConfig = {
  hasPin: false,
  pinHash: null,
  hasBiometric: false,
  credentialId: null,
};

// --- base64url helpers ---
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function loadConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(SECURITY_KEY);
    if (!raw) return { ...EMPTY_CONFIG };
    return { ...EMPTY_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_CONFIG };
  }
}

function saveConfig(config: SecurityConfig): void {
  localStorage.setItem(SECURITY_KEY, JSON.stringify(config));
}

// --- PIN (SHA-256 hashed) ---
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`authenticator:${pin}:salt`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64Url(new Uint8Array(buf));
}

// --- WebAuthn (biometrics) ---
function isSecureContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  );
}

async function isBiometricSupported(): Promise<boolean> {
  try {
    const cred = (window as any).PublicKeyCredential;
    if (!cred || !isSecureContext()) return false;
    if (typeof cred.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await cred.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch {
    return false;
  }
}

async function enrollBiometric(): Promise<string> {
  if (!isSecureContext()) throw new Error('Biometrics require a secure connection');
  const cred = (window as any).PublicKeyCredential as any;
  if (!cred) throw new Error('Biometrics not supported in this browser');

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { id: window.location.hostname, name: 'Authenticator' },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: 'auth',
      displayName: 'Authenticator',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  };

  const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
  if (!credential) throw new Error('Biometric setup was cancelled');
  // cred.id is already a base64url string
  return credential.id;
}

async function verifyBiometric(credentialId: string): Promise<boolean> {
  if (!isSecureContext()) throw new Error('Biometrics require a secure connection');
  const cred = (window as any).PublicKeyCredential;
  if (!cred) throw new Error('Biometrics not supported in this browser');

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rpId: window.location.hostname,
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: [{ type: 'public-key', id: base64UrlToBytes(credentialId) }],
  };

  const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential;
  if (!assertion) return false;

  // authenticatorData flags byte is at offset 32 (after the 32-byte rpIdHash).
  const response = assertion.response as AuthenticatorAssertionResponse;
  const authData = new Uint8Array(response.authenticatorData);
  const flags = authData[32];
  const USER_PRESENT = 0x01;
  return (flags & USER_PRESENT) === USER_PRESENT;
}

export const authService = {
  isSecureContext,

  hasSecuritySetup(): boolean {
    const config = loadConfig();
    return config.hasPin || config.hasBiometric;
  },

  getSecurityState() {
    const config = loadConfig();
    return {
      hasPin: config.hasPin,
      hasBiometric: config.hasBiometric,
    };
  },

  async isBiometricSupported() {
    return isBiometricSupported();
  },

  async setup(pin: string, enableBiometric: boolean): Promise<void> {
    const config = loadConfig();
    const pinHash = await hashPin(pin);
    config.hasPin = true;
    config.pinHash = pinHash;

    if (enableBiometric) {
      const credentialId = await enrollBiometric();
      config.hasBiometric = true;
      config.credentialId = credentialId;
    }
    saveConfig(config);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const config = loadConfig();
    if (!config.hasPin || !config.pinHash) return false;
    const hash = await hashPin(pin);
    return hash === config.pinHash;
  },

  async verifyBiometric(): Promise<boolean> {
    const config = loadConfig();
    if (!config.hasBiometric || !config.credentialId) return false;
    return verifyBiometric(config.credentialId);
  },
};
