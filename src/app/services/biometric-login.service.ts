import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AndroidBiometryStrength, BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

const CREDENTIALS_KEY = 'login_credentials';

@Injectable({
  providedIn: 'root'
})
export class BiometricLoginService {
  private storageReady: Promise<void> | null = null;

  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const result = await BiometricAuth.checkBiometry();
    return result.strongBiometryIsAvailable;
  }

  async authenticate(): Promise<void> {
    await BiometricAuth.authenticate({
      reason: 'Confirma tu identidad para entrar a ClicContigo',
      cancelTitle: 'Cancelar',
      allowDeviceCredential: false,
      androidTitle: 'Entrar a ClicContigo',
      androidSubtitle: 'Confirma tu identidad con biometría',
      androidBiometryStrength: AndroidBiometryStrength.strong,
      iosFallbackTitle: ''
    });
  }

  async getSavedCredentials(): Promise<LoginCredentials | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    await this.ensureStorageReady();
    const stored = await SecureStorage.get(CREDENTIALS_KEY);
    if (
      stored === null ||
      typeof stored !== 'object' ||
      Array.isArray(stored) ||
      !('email' in stored) ||
      !('password' in stored) ||
      typeof stored['email'] !== 'string' ||
      typeof stored['password'] !== 'string'
    ) {
      if (stored !== null) {
        await SecureStorage.remove(CREDENTIALS_KEY);
      }
      return null;
    }

    return { email: stored['email'], password: stored['password'] };
  }

  async hasSavedCredentials(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    await this.ensureStorageReady();
    const keys = await SecureStorage.keys();
    return keys.includes(CREDENTIALS_KEY);
  }

  async saveCredentials(credentials: LoginCredentials): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('El almacenamiento biométrico solo está disponible en la aplicación móvil.');
    }

    await this.ensureStorageReady();
    await SecureStorage.set(CREDENTIALS_KEY, {
      email: credentials.email,
      password: credentials.password
    });
  }

  async removeSavedCredentials(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await this.ensureStorageReady();
    await SecureStorage.remove(CREDENTIALS_KEY);
  }

  private ensureStorageReady(): Promise<void> {
    if (!this.storageReady) {
      this.storageReady = SecureStorage.setKeyPrefix('cliccontigo_').catch((error: unknown) => {
        this.storageReady = null;
        throw error;
      });
    }

    return this.storageReady;
  }
}
