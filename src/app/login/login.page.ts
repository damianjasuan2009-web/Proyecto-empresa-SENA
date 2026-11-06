import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { BiometryErrorType } from '@aparajita/capacitor-biometric-auth';
import { AuthService } from '../services/auth.service';
import { BiometricLoginService, LoginCredentials } from '../services/biometric-login.service';

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
  private readonly biometricLogin = inject(BiometricLoginService);

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
      message: 'Entrando a ClicContigo... Un momento por favor',
      spinner: 'crescent',
      cssClass: 'warm-loading'
    });
    await loading.present();

    try {
      const credentials: LoginCredentials = this.credentials.getRawValue();
      await this.authService.login(credentials);
      await loading.dismiss();
      this.router.navigateByUrl('/home', { replaceUrl: true });
      void this.offerBiometricSetup(credentials);
    } catch (error: any) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: this.getErrorMessage(error.code),
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

  async loginWithBiometrics() {
    try {
      if (!await this.biometricLogin.isAvailable()) {
        await this.showToast('Este dispositivo no tiene biometría compatible configurada. Inicia sesión con tu correo y contraseña.', 'warning');
        return;
      }

      if (!await this.biometricLogin.hasSavedCredentials()) {
        await this.showToast('Primero inicia sesión con tu correo y contraseña y activa la huella cuando te lo ofrezcamos.', 'warning');
        return;
      }

      await this.biometricLogin.authenticate();
      const savedCredentials = await this.biometricLogin.getSavedCredentials();
      if (!savedCredentials) {
        await this.showToast('No encontramos los datos guardados. Inicia sesión con tu correo y contraseña para configurarlo de nuevo.', 'warning');
        return;
      }

      await this.authService.login(savedCredentials);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: unknown) {
      const code = this.getAuthErrorCode(error);
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        await this.biometricLogin.removeSavedCredentials();
        await this.showToast('La contraseña guardada ya no es válida. Inicia sesión con tu correo y contraseña para volver a configurar la huella.', 'warning');
        return;
      }

      if (this.isBiometricCancellation(code)) {
        return;
      }

      await this.showToast('No se pudo verificar tu identidad. Inténtalo de nuevo o inicia sesión con tu correo y contraseña.', 'warning');
    }
  }

  private async offerBiometricSetup(credentials: LoginCredentials): Promise<void> {
    try {
      if (!await this.biometricLogin.isAvailable()) {
        return;
      }

      const savedCredentials = await this.biometricLogin.getSavedCredentials();
      if (savedCredentials?.email.toLowerCase() === credentials.email.toLowerCase()) {
        await this.biometricLogin.saveCredentials(credentials);
        return;
      }

      const toast = await this.toastController.create({
        message: savedCredentials
          ? '¿Quieres usar la cuenta actual para el inicio biométrico en este dispositivo?'
          : 'Puedes activar el inicio con huella para entrar más rápido la próxima vez.',
        duration: 10000,
        position: 'bottom',
        buttons: [
          {
            text: savedCredentials ? 'Cambiar' : 'Activar',
            handler: () => {
              void this.activateBiometricLogin(credentials);
            }
          }
        ]
      });
      await toast.present();
    } catch {
      await this.showToast('No se pudo comprobar la disponibilidad de la biometría. Puedes iniciar sesión normalmente.', 'warning');
    }
  }

  private async activateBiometricLogin(credentials: LoginCredentials): Promise<void> {
    try {
      await this.biometricLogin.authenticate();
      await this.biometricLogin.saveCredentials(credentials);
      await this.showToast('Inicio biométrico activado en este dispositivo.', 'success');
    } catch (error: unknown) {
      if (this.isBiometricCancellation(this.getAuthErrorCode(error))) {
        return;
      }

      await this.showToast('No se pudo configurar el inicio biométrico. Puedes iniciar sesión con tu correo y contraseña.', 'warning');
    }
  }

  private getAuthErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return undefined;
    }

    return typeof error.code === 'string' ? error.code : undefined;
  }

  private isBiometricCancellation(code: string | undefined): boolean {
    return code === BiometryErrorType.userCancel ||
      code === BiometryErrorType.systemCancel ||
      code === BiometryErrorType.appCancel;
  }

  async requestHelp() {
    const alert = await this.alertController.create({
      header: '¿Necesitas ayuda para entrar?',
      subHeader: 'Estamos contigo para guiarte paso a paso',
      message: 'Para proteger tu cuenta, contacta a tu familia o a soporte desde un número de teléfono que ya conozcas. También puedes usar “¿Olvidaste tu contraseña?” para recuperar el acceso por correo.',
      buttons: [
        { text: 'Entendido', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  async forgotPassword(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      message: 'Escribe el correo asociado a tu cuenta. Si está registrado, Firebase te enviará un enlace para crear una nueva contraseña.',
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
          text: 'Enviar enlace',
          handler: async (data: { email?: string }) => {
            const email = data.email?.trim() ?? '';
            const emailControl = this.fb.control(email, [Validators.required, Validators.email]);
            if (emailControl.invalid) {
              await this.showToast('Escribe un correo electrónico válido.', 'warning');
              return false;
            }

            try {
              await this.authService.sendPasswordResetEmail(email);
              await this.showToast('Si el correo está registrado, recibirás instrucciones para recuperar tu cuenta.', 'success');
              return true;
            } catch (error: unknown) {
              await this.showToast(this.getPasswordResetErrorMessage(this.getAuthErrorCode(error)), 'danger');
              return false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private getPasswordResetErrorMessage(code: string | undefined): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'El formato del correo no es válido. Revísalo e inténtalo de nuevo.';
      case 'auth/too-many-requests':
        return 'Se hicieron demasiadas solicitudes. Espera un momento antes de volver a intentarlo.';
      case 'auth/network-request-failed':
        return 'No se pudo conectar. Revisa tu conexión a internet e inténtalo de nuevo.';
      default:
        return 'No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo.';
    }
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

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'El correo o la contraseña no coinciden. Revisa que estén bien escritos o pulsa "¿Necesitas ayuda?".';
      case 'auth/invalid-email':
        return 'El formato del correo no es válido. Ejemplo: nombre@correo.com';
      case 'auth/too-many-requests':
        return 'Muchos intentos seguidos. Por tu seguridad, espera un momento antes de volver a intentar.';
      default:
        return 'No se pudo iniciar sesión. Verifica tu conexión a internet o pide ayuda a tu familiar.';
    }
  }
}
