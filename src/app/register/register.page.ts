import { Component, OnInit } from '@angular/core';
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
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
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

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'El correo electrónico ya está registrado.';
      case 'auth/invalid-email':
        return 'El correo electrónico ingresado no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      default:
        return 'Ocurrió un error al registrar la cuenta. Inténtalo de nuevo.';
    }
  }
}
