export interface AuthenticatorAccount {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  createdAt: number;
}

export interface EncryptedData {
  iv: string;
  ciphertext: string;
  salt: string;
}
