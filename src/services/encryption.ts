import CryptoJS from 'crypto-js';
import { EncryptedData } from '../types';

// NOTE: In production, derive the key from a user-provided password
// stored via a Keychain/Keystore plugin (e.g. @capacitor/preferences with
// secure storage, or a custom native implementation).
const ENCRYPTION_KEY = 'authenticator-secret-key-2024';

export const encryptionService = {
  encrypt(data: string): EncryptedData {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });

    return {
      iv: iv.toString(CryptoJS.enc.Base64),
      ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      salt: salt.toString(CryptoJS.enc.Base64),
    };
  },

  decrypt(encryptedData: EncryptedData): string {
    const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
    const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const decrypted = CryptoJS.AES.decrypt(encryptedData.ciphertext, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  },
};
