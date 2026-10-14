import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LearningContentService } from '../services/learning-content.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly learningContent = inject(LearningContentService);
  streakDays = 12;
  levelName = 'Explorador Digital';

  goToSettings() {
    this.router.navigateByUrl('/settings', { replaceUrl: false });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
