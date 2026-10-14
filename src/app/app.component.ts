import { Component, inject, OnInit } from '@angular/core';
import { ThemePreferencesService } from './services/theme-preferences.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly themePreferences = inject(ThemePreferencesService);

  ngOnInit(): void {
    this.themePreferences.applySavedPreferences();
  }
}
