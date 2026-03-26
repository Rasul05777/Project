import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { PushService } from '../../core/services/push.service';
import { PushRequest, ApiErrorBody } from '../../core/models';

export interface PushDialogData {
  userIds: number[];
}

@Component({
  selector: 'app-push-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">notifications_active</mat-icon>
      Отправка PUSH-сообщения
    </h2>

    <mat-dialog-content>
      <p class="recipients-info">
        Получателей: <strong>{{ data.userIds.length }}</strong>
      </p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Текст сообщения</mat-label>
          <textarea
            matInput
            formControlName="message"
            rows="4"
            placeholder="Введите текст PUSH-уведомления..."
            cdkTextareaAutosize
          ></textarea>
          @if (form.controls.message.hasError('required') && form.controls.message.touched) {
            <mat-error>Введите текст сообщения</mat-error>
          }
          <mat-hint align="end">{{ form.controls.message.value.length }} символов</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="isScheduled" class="schedule-checkbox">
          Отложенная отправка
        </mat-checkbox>

        @if (form.controls.isScheduled.value) {
          <div class="schedule-fields">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Дата отправки</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="scheduledDate" />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Время отправки (ЧЧ:ММ)</mat-label>
              <input matInput type="time" formControlName="scheduledTime" />
            </mat-form-field>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="sending()">Отмена</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="sending()"
        (click)="send()"
      >
        @if (sending()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>send</mat-icon>
            Отправить
          </ng-container>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon {
      vertical-align: middle;
      margin-right: 8px;
    }

    .recipients-info {
      margin: 0 0 16px;
      color: #666;
    }

    .full-width {
      width: 100%;
    }

    .schedule-checkbox {
      display: block;
      margin: 12px 0;
    }

    .schedule-fields {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .schedule-fields mat-form-field {
      flex: 1;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
    }

    mat-dialog-actions button mat-icon {
      margin-right: 4px;
    }
  `],
})
export class PushDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pushService = inject(PushService);
  private readonly dialogRef = inject(MatDialogRef<PushDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  readonly data: PushDialogData = inject(MAT_DIALOG_DATA);
  readonly sending = signal(false);

  readonly form = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(1)]],
    isScheduled: [false],
    scheduledDate: [''],
    scheduledTime: ['12:00'],
  });

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { message, isScheduled, scheduledDate, scheduledTime } = this.form.getRawValue();

    const request: PushRequest = {
      message: message.trim(),
      user_ids: this.data.userIds,
    };

    if (isScheduled && scheduledDate) {
      request.date_start = this.buildDateStart(scheduledDate, scheduledTime);
    }

    this.sending.set(true);

    this.pushService.sendPush(request).subscribe({
      next: () => this.dialogRef.close('sent'),
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        const body = err.error as ApiErrorBody | null;
        this.snackBar.open(
          body?.message ?? `Ошибка отправки (${err.status})`,
          'Закрыть',
          { duration: 5000 },
        );
      },
    });
  }

  private buildDateStart(dateValue: string, timeValue: string): string {
    const date = new Date(dateValue);
    if (timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return date.toISOString();
  }
}
