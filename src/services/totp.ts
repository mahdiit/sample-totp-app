import * as OTPAuth from 'otpauth';
import { AuthenticatorAccount } from '../types';

export const totpService = {
  generateTOTP(account: AuthenticatorAccount): string {
    const totp = new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.account,
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
      secret: OTPAuth.Secret.fromBase32(account.secret),
    });

    return totp.generate();
  },

  getRemainingTime(period: number): number {
    const now = Math.floor(Date.now() / 1000);
    return period - (now % period);
  },

  parseOTPAuthURI(uri: string): Omit<AuthenticatorAccount, 'id' | 'createdAt'> | null {
    try {
      const url = new URL(uri);
      
      if (url.protocol !== 'otpauth:') {
        return null;
      }

      const type = url.hostname;
      if (type !== 'totp') {
        return null;
      }

      const label = decodeURIComponent(url.pathname.slice(1));
      const params = url.searchParams;

      let issuer = params.get('issuer') || '';
      let account = label;

      if (label.includes(':')) {
        const parts = label.split(':');
        issuer = issuer || parts[0];
        account = parts.slice(1).join(':');
      }

      const secret = params.get('secret');
      if (!secret) {
        return null;
      }

      return {
        issuer: issuer || 'Unknown',
        account: account || 'Unknown',
        secret: secret.toUpperCase(),
        algorithm: (params.get('algorithm') as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
        digits: parseInt(params.get('digits') || '6') as 6 | 8,
        period: parseInt(params.get('period') || '30'),
      };
    } catch (error) {
      console.error('Failed to parse OTP URI:', error);
      return null;
    }
  },
};
