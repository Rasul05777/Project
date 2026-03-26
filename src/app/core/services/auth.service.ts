import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models';

const TOKEN_KEY = 'teyca_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** Реактивный сигнал текущего токена */
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  /** Вычисляемый сигнал статуса авторизации */
  readonly isAuthenticated = computed(() => !!this.token());

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(environment.authUrl, { login, password })
      .pipe(
        timeout(10000),
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          this.token.set(res.token);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.router.navigate(['/login']);
  }

  /** Формирует базовый URL для API-запросов с токеном */
  getApiUrl(path: string): string {
    return `${environment.apiBase}/v1/${this.token()}/${path}`;
  }
}
