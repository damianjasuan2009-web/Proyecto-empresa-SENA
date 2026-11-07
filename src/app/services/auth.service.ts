import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  user
} from '@angular/fire/auth';
import type { User } from 'firebase/auth';
import { firstValueFrom, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  readonly user$: Observable<User | null> = user(this.auth);

  register({ email, password }: { email: string; password: string }) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  login({ email, password }: { email: string; password: string }) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  async getCurrentUser(): Promise<User | null> {
    return await firstValueFrom(this.user$.pipe(take(1)));
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}