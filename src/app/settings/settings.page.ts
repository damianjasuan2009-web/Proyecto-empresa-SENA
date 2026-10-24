import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ThemePreferencesService, UserPreferences } from '../services/theme-preferences.service';

type TogglePreference = 'darkMode' | 'highContrast' | 'compactView' | 'emailNotifications' | 'weeklyReports';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly themePreferences = inject(ThemePreferencesService);

  preferences: UserPreferences = {
    darkMode: false,
    highContrast: false,
    compactView: false,
    emailNotifications: true,
    weeklyReports: true,
    fontSize: 'normal'
  };

  private readonly storageKey = 'teacompano-settings';

  ngOnInit() {
    this.loadPreferences();
    this.applyTheme();
  }

  loadPreferences() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Saved preferences must be an object.');
      }

      const values = parsed as Record<string, unknown>;
      this.preferences = {
        darkMode: values['darkMode'] === true,
        highContrast: values['highContrast'] === true,
        compactView: values['compactView'] === true,
        emailNotifications: values['emailNotifications'] !== false,
        weeklyReports: values['weeklyReports'] !== false,
        fontSize: values['fontSize'] === 'large' ? 'large' : 'normal'
      };
    } catch (error: unknown) {
      console.warn('Could not load saved preferences; defaults will be used.', error);
      localStorage.removeItem(this.storageKey);
    }
  }

  async savePreferences() {
    this.persistPreferences();

    const toast = await this.toastController.create({
      message: 'Preferencias guardadas correctamente.',
      duration: 1800,
      color: 'success',
      position: 'bottom'
    });

    await toast.present();
  }

  resetPreferences() {
    this.preferences = {
      darkMode: false,
      highContrast: false,
      compactView: false,
      emailNotifications: true,
      weeklyReports: true,
      fontSize: 'normal'
    };

    this.persistPreferences();
  }

  onPreferenceToggle(preference: TogglePreference, checked: boolean): void {
    this.preferences[preference] = checked;
    this.persistPreferences();
  }

  persistFontSize(fontSize: UserPreferences['fontSize']): void {
    if (fontSize !== 'normal' && fontSize !== 'large') {
      return;
    }

    this.preferences.fontSize = fontSize;
    this.persistPreferences();
  }

  private persistPreferences(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    this.applyTheme();
  }

  applyTheme() {
    this.themePreferences.apply(this.preferences);
  }

  goBack() {
    this.router.navigateByUrl('/home', { replaceUrl: false });
  }
}
