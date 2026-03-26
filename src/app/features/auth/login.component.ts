import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ApiErrorBody } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>TEYCA</mat-card-title>
          <mat-card-subtitle>Вход в систему управления клиентами</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Логин</mat-label>
              <input matInput formControlName="login" autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
              @if (form.controls.login.hasError('required') && form.controls.login.touched) {
                <mat-error>Обязательное поле</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword.set(!hidePassword())"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.hasError('required') && form.controls.password.touched) {
                <mat-error>Обязательное поле</mat-error>
              }
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width submit-btn"
              [disabled]="loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                Войти
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 32px 24px 24px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 4px;
    }

    .submit-btn {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
    }

    .submit-btn mat-spinner {
      margin: 0 auto;
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { login, password } = this.form.getRawValue();

    this.authService.login(login, password).subscribe({
      next: () => this.router.navigate(['/clients']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        let message: string;
        if (err.status === 0) {
          message = 'Сервер недоступен. Проверьте подключение к сети.';
        } else if (err.status === 403) {
          message = 'Доступ запрещён сервером (403). Возможна IP-фильтрация.';
        } else if (err.name === 'TimeoutError') {
          message = 'Превышено время ожидания ответа от сервера.';
        } else {
          const body = err.error as ApiErrorBody | null;
          message = body?.message ?? `Ошибка авторизации (${err.status}).`;
        }
        this.snackBar.open(message, 'Закрыть', { duration: 7000 });
      },
    });
  }
}
