import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
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
  private readonly toastController = inject(ToastController);
  readonly learningContent = inject(LearningContentService);
  photoPreview: string | null = null;
  private selectedPhoto: File | null = null;

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Buenos días';
    }
    if (hour < 18) {
      return 'Buenas tardes';
    }
    return 'Buenas noches';
  }

  get focusMessage(): string {
    const progress = this.learningContent.learningProgress;
    if (progress < 30) {
      return 'Hoy puedes dar un paso pequeño pero importante: empieza con una guía o una práctica rápida.';
    }
    if (progress < 70) {
      return 'Tu progreso va muy bien. Sigue con una práctica y refuerza lo que ya aprendiste.';
    }
    return 'Tienes muy buen avance. Mantén el ritmo y sigue disfrutando del aprendizaje.';
  }

  get summaryCards(): Array<{ label: string; value: string; hint: string; tone: string; icon: string }> {
    return [
      {
        label: 'Guías completadas',
        value: `${this.learningContent.totalCompletedTutorials}`,
        hint: 'de 7 disponibles',
        tone: 'sage',
        icon: 'checkmark-circle-outline'
      },
      {
        label: 'Prácticas',
        value: `${this.learningContent.completedVerifications}`,
        hint: 'actividades revisadas',
        tone: 'blue',
        icon: 'sparkles-outline'
      },
      {
        label: 'Progreso',
        value: `${this.learningContent.learningProgress}%`,
        hint: 'meta semanal',
        tone: 'gold',
        icon: 'trending-up-outline'
      },
      {
        label: 'Ayuda rápida',
        value: 'Listo',
        hint: 'en 1 toque',
        tone: 'peach',
        icon: 'shield-checkmark-outline'
      }
    ];
  }

  openContacts(action: 'call' | 'message'): void {
    void this.router.navigate(['/apartados/contactos'], { queryParams: { action } });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const photo = input.files?.[0];
    if (!photo) {
      return;
    }

    if (!photo.type.startsWith('image/')) {
      void this.showToast('Elige una imagen para continuar.', 'warning');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedPhoto = photo;
      this.photoPreview = String(reader.result);
      void this.showToast('La foto está lista para compartir.', 'success');
    };
    reader.onerror = () => void this.showToast('No pudimos abrir la foto. Inténtalo otra vez.', 'danger');
    reader.readAsDataURL(photo);
    input.value = '';
  }

  clearPhoto(): void {
    this.photoPreview = null;
    this.selectedPhoto = null;
  }

  async sharePhoto(): Promise<void> {
    const photo = this.selectedPhoto;
    if (!photo) {
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [photo] })) {
      try {
        await navigator.share({ files: [photo], title: 'Compartir una foto' });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          await this.showToast('No se pudo compartir la foto. Inténtalo nuevamente.', 'warning');
        }
      }
      return;
    }

    await this.showToast('Este dispositivo no ofrece compartir desde aquí. Puedes volver a elegir la foto.', 'warning');
  }

  goToSettings() {
    this.router.navigateByUrl('/settings', { replaceUrl: false });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2200, position: 'bottom' });
    await toast.present();
  }
}
