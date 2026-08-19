import { AuthenticatorAccount, EncryptedData } from '../types';
import { encryptionService } from './encryption';

const STORAGE_KEY = 'authenticator_accounts';

export const storageService = {
  saveAccounts(accounts: AuthenticatorAccount[]): void {
    try {
      const dataToEncrypt = JSON.stringify(accounts);
      const encrypted = encryptionService.encrypt(dataToEncrypt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to save accounts:', error);
      throw error;
    }
  },

  loadAccounts(): AuthenticatorAccount[] {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) {
        return [];
      }
      const encrypted: EncryptedData = JSON.parse(encryptedData);
      const decrypted = encryptionService.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return [];
    }
  },

  addAccount(account: AuthenticatorAccount): AuthenticatorAccount[] {
    const accounts = this.loadAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);
    return accounts;
  },

  removeAccount(id: string): AuthenticatorAccount[] {
    const accounts = this.loadAccounts();
    const filtered = accounts.filter(acc => acc.id !== id);
    this.saveAccounts(filtered);
    return filtered;
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
