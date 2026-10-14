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

  async loginWithPhone() {
    const alert = await this.alertController.create({
      header: 'Ingreso con Celular',
      subHeader: 'Código por mensaje de texto (SMS)',
      message: 'Te enviaremos un código de 6 números a tu celular para que no tengas que escribir contraseña.',
      inputs: [
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Ejemplo: 300 123 4567',
          attributes: {
            inputmode: 'tel'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar código',
          handler: (data) => {
            if (data.phone) {
              this.showToast('Código enviado a ' + data.phone + '. Revisa tus mensajes.', 'success');
            } else {
              this.showToast('Por favor escribe tu número de teléfono', 'warning');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async loginWithBiometrics() {
    const alert = await this.alertController.create({
      header: 'Huella o Reconocimiento',
      message: 'Coloca tu dedo en el lector de huella o mira a la cámara de tu teléfono para ingresar.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Identificarme',
          handler: () => {
            this.showToast('Acceso biométrico listo para este dispositivo', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async requestHelp() {
    const alert = await this.alertController.create({
      header: '¿Necesitas ayuda para entrar?',
      subHeader: 'Estamos contigo para guiarte paso a paso',
      message: 'Elige una de las siguientes opciones para recibir asistencia inmediata:',
      buttons: [
        {
          text: 'Llamar a mi familiar de confianza',
          handler: () => {
            this.showToast('Iniciando llamada con tu contacto de apoyo...', 'secondary');
          }
        },
        {
          text: 'Llamar a Soporte SENA',
          handler: () => {
            this.showToast('Conectando con el equipo de soporte técnico...', 'secondary');
          }
        },
        {
          text: 'Recuperar mi contraseña por correo',
          handler: () => {
            this.forgotPassword();
          }
        },
        {
          text: 'Volver atrás',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
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
          handler: (data) => {
            if (data.email) {
              this.showToast('Se ha enviado un correo con instrucciones a ' + data.email, 'success');
            } else {
              this.showToast('Por favor escribe un correo válido', 'warning');
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
