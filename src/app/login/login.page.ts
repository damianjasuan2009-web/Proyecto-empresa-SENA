import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  credentials!: FormGroup;
  showPassword = false;
  isLargeFont = false;

  ngOnInit() {
    this.credentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() {
    return this.credentials.get('email');
  }

  get password() {
    return this.credentials.get('password');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleFontSize() {
    this.isLargeFont = !this.isLargeFont;
    const msg = this.isLargeFont 
      ? 'Modo de letra más grande activado' 
      : 'Modo de letra estándar activado';
    this.showToast(msg, 'success');
  }

  async login() {
    if (this.credentials.invalid) {
      this.credentials.markAllAsTouched();
      this.showToast('Por favor revisa los datos ingresados', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Entrando a TeAcompaño... Un momento por favor',
      spinner: 'crescent',
      cssClass: 'warm-loading'
    });
    await loading.present();

    try {
      await this.authService.login(this.credentials.value);
      await loading.dismiss();
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: unknown) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: this.getErrorMessage(this.getErrorCode(error)),
        duration: 4000,
        color: 'danger',
        position: 'bottom',
        buttons: [
          {
            text: 'Entendido',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Escribe el correo electrónico con el que te registraste. Te enviaremos un enlace sencillo para crear una nueva clave.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tucorreo@ejemplo.com',
          value: this.credentials.get('email')?.value || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar correo',
          handler: async (data: { email?: string }) => {
            const email = String(data.email ?? '').trim();
            if (this.fb.control(email, [Validators.required, Validators.email]).invalid) {
              await this.showToast('Escribe una dirección de correo válida para continuar.', 'warning');
              return false;
            }

            try {
              await this.authService.sendPasswordReset(email);
              await this.showToast(
                'Si el correo corresponde a una cuenta, recibirás allí las instrucciones para cambiar la contraseña.',
                'success'
              );
              return true;
            } catch (error: unknown) {
              await this.showToast(this.getResetErrorMessage(this.getErrorCode(error)), 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      color,
      position: 'bottom',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  private getErrorCode(error: unknown): string {
    return typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';
  }

  private getResetErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'El formato del correo no es válido. Revísalo e inténtalo de nuevo.';
      case 'auth/too-many-requests':
        return 'Se hicieron demasiadas solicitudes. Espera un momento antes de intentarlo otra vez.';
      case 'auth/network-request-failed':
        return 'No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.';
      default:
        return 'No se pudo solicitar el cambio de contraseña. Inténtalo de nuevo o pide ayuda a una persona de confianza.';
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'El correo o la contraseña no coinciden. Revisa que estén bien escritos o pulsa "Recuperar contraseña".';
      case 'auth/invalid-email':
        return 'El formato del correo no es válido. Ejemplo: nombre@correo.com';
      case 'auth/too-many-requests':
        return 'Muchos intentos seguidos. Por tu seguridad, espera un momento antes de volver a intentar.';
      default:
        return 'No se pudo iniciar sesión. Verifica tu conexión a internet o pide ayuda a tu familiar.';
    }
  }
}
