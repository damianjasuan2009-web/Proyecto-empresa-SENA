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
  private readonly storageKey = 'teacompano-settings';

  applySavedPreferences(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.apply(JSON.parse(saved) as Partial<UserPreferences>);
      }
    } catch {
      this.apply({});
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