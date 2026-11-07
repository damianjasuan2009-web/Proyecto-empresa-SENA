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

  private readonly storageKey = 'cliccontigo-settings';

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
        return;
      }

      const values = parsed as Partial<UserPreferences>;
      this.preferences = {
        darkMode: typeof values.darkMode === 'boolean' ? values.darkMode : this.preferences.darkMode,
        highContrast: typeof values.highContrast === 'boolean' ? values.highContrast : this.preferences.highContrast,
        compactView: typeof values.compactView === 'boolean' ? values.compactView : this.preferences.compactView,
        emailNotifications: typeof values.emailNotifications === 'boolean'
          ? values.emailNotifications
          : this.preferences.emailNotifications,
        weeklyReports: typeof values.weeklyReports === 'boolean' ? values.weeklyReports : this.preferences.weeklyReports,
        fontSize: values.fontSize === 'large' || values.fontSize === 'normal'
          ? values.fontSize
          : this.preferences.fontSize
      };
    } catch {
      console.warn('No se pudieron leer las preferencias guardadas; se usarán los valores predeterminados.');
    }
  }

  async savePreferences() {
    const saved = this.persistPreferences();

    const toast = await this.toastController.create({
      message: saved
        ? 'Preferencias guardadas correctamente.'
        : 'Los cambios se aplicaron, pero este navegador no permite guardarlos para la próxima visita.',
      duration: 1800,
      color: saved ? 'success' : 'warning',
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

  private persistPreferences(): boolean {
    try {
      if (typeof localStorage === 'undefined') {
        this.applyTheme();
        return false;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch {
      console.warn('No se pudieron guardar las preferencias en el almacenamiento local.');
      this.applyTheme();
      return false;
    }

    this.applyTheme();
    return true;
  }

  applyTheme() {
    this.themePreferences.apply(this.preferences);
  }

  goBack() {
    this.router.navigateByUrl('/home', { replaceUrl: false });
  }
}
