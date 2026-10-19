import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authenticatedGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return await authService.getCurrentUser() ? true : router.createUrlTree(['/login']);
};

export const signedOutGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return await authService.getCurrentUser() ? router.createUrlTree(['/home']) : true;
};
