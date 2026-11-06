import { Injectable } from '@angular/core';

export interface UserPreferences {
  darkMode: boolean;
  highContrast: boolean;
  compactView: boolean;
  emailNotifications: boolean;
  weeklyReports: boolean;
  fontSize: 'normal' | 'large';
}

@Injectable({ providedIn: 'root' })
export class ThemePreferencesService {
  private readonly storageKey = 'cliccontigo-settings';

  applySavedPreferences(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const preferences: unknown = JSON.parse(saved);
        if (typeof preferences === 'object' && preferences !== null && !Array.isArray(preferences)) {
          this.apply(preferences as Partial<UserPreferences>);
        }
      }
    } catch {
      this.apply({});
      console.warn('No se pudieron leer las preferencias guardadas; se usará el tema predeterminado.');
    }
  }

  apply(preferences: Partial<UserPreferences>): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.toggle('theme-dark', preferences.darkMode === true);
    document.body.classList.toggle('theme-high-contrast', preferences.highContrast === true);
    document.body.classList.toggle('compact-view', preferences.compactView === true);
    document.body.classList.toggle('large-font', preferences.fontSize === 'large');
    document.documentElement.classList.toggle('large-font', preferences.fontSize === 'large');
  }
}