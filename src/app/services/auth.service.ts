import { inject, Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { firstValueFrom, Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly auth = inject(Auth);
  user$: Observable<User | null> = user(this.auth);

  async register({ email, password }: { email: string; password: string }): Promise<any> {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async login({ email, password }: { email: string; password: string }): Promise<any> {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async getCurrentUser(): Promise<User | null> {
    return await firstValueFrom(this.user$.pipe(take(1)));
  }

  async logout(): Promise<void> {
    return await signOut(this.auth);
  }
}