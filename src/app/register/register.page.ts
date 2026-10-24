import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly loadingController = inject(LoadingController);
  private readonly toastController = inject(ToastController);

  registerForm!: FormGroup;

  ngOnInit() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  async register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      await this.showToast('Revisa los datos del formulario antes de continuar.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando usuario...'
    });
    await loading.present();

    try {
      await this.authService.register({
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      });
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: '¡Cuenta creada con éxito!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      const toast = await this.toastController.create({
        message: this.getErrorMessage(error.code),
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' | 'secondary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo electrónico ya está registrado.';
      case 'auth/invalid-email':
        return 'El correo electrónico ingresado no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      case 'auth/network-request-failed':
        return 'No se pudo completar la solicitud. Revisa tu conexión e inténtalo otra vez.';
      default:
        return 'Ocurrió un error al registrar la cuenta. Inténtalo de nuevo.';
    }
  }
}
