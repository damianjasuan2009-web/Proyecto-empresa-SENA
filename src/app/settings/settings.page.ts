import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ThemePreferencesService, UserPreferences } from '../services/theme-preferences.service';

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
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      return;
    }

    try {
      this.preferences = { ...this.preferences, ...JSON.parse(saved) };
    } catch {
      this.preferences = { ...this.preferences };
    }
  }

  async savePreferences() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    this.applyTheme();

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
