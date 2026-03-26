import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap, finalize } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { HttpErrorResponse } from '@angular/common/http';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PassesService } from '../../core/services/passes.service';
import { AuthService } from '../../core/services/auth.service';
import { Pass, ApiErrorBody } from '../../core/models';
import { PushDialogComponent, PushDialogData } from './push-dialog.component';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar">
      <mat-icon class="logo-icon">credit_card</mat-icon>
      <span class="toolbar-title">TEYCA — Клиенты</span>
      <span class="spacer"></span>
      <button mat-icon-button matTooltip="Выйти" (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="container">
      <!-- Actions -->
      <div class="actions-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Поиск по телефону</mat-label>
          <input
            matInput
            placeholder="79876543211"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchInput($event)"
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <button
          mat-raised-button
          color="accent"
          [disabled]="selection.isEmpty()"
          (click)="openPushDialog()"
        >
          <mat-icon>send</mat-icon>
          Отправить PUSH
          @if (selection.hasValue()) {
            <span>&nbsp;({{ selection.selected.length }})</span>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      }

      <!-- Table -->
      <div class="table-wrapper mat-elevation-z2">
        <table mat-table [dataSource]="clients()">
          <!-- Checkbox -->
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                [checked]="isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
                (change)="toggleAllRows($event.checked)"
              ></mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox
                [checked]="selection.isSelected(row)"
                (click)="$event.stopPropagation()"
                (change)="selection.toggle(row)"
              ></mat-checkbox>
            </td>
          </ng-container>

          <!-- ID -->
          <ng-container matColumnDef="user_id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let row">{{ row.user_id }}</td>
          </ng-container>

          <!-- ФИО -->
          <ng-container matColumnDef="fio">
            <th mat-header-cell *matHeaderCellDef>ФИО</th>
            <td mat-cell *matCellDef="let row">{{ row.fio || '—' }}</td>
          </ng-container>

          <!-- Телефон -->
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Телефон</th>
            <td mat-cell *matCellDef="let row">{{ row.phone || '—' }}</td>
          </ng-container>

          <!-- Email -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let row">{{ row.email || '—' }}</td>
          </ng-container>

          <!-- Бонусы -->
          <ng-container matColumnDef="bonus">
            <th mat-header-cell *matHeaderCellDef>Бонусы</th>
            <td mat-cell *matCellDef="let row">{{ row.bonus || '0' }}</td>
          </ng-container>

          <!-- Скидка -->
          <ng-container matColumnDef="discount">
            <th mat-header-cell *matHeaderCellDef>Скидка</th>
            <td mat-cell *matCellDef="let row">{{ row.discount || '0' }}%</td>
          </ng-container>

          <!-- Штрих-код -->
          <ng-container matColumnDef="barcode">
            <th mat-header-cell *matHeaderCellDef>Штрих-код</th>
            <td mat-cell *matCellDef="let row">{{ row.barcode || '—' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            [class.selected-row]="selection.isSelected(row)"
          ></tr>
        </table>

        @if (!loading() && clients().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Клиенты не найдены</p>
          </div>
        }
      </div>

      <!-- Paginator -->
      <mat-paginator
        [length]="totalItems()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="pageSizeOptions"
        (page)="onPageChange($event)"
        showFirstLastButtons
      ></mat-paginator>
    </div>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo-icon {
      margin-right: 12px;
    }

    .toolbar-title {
      font-size: 18px;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .actions-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }

    .loading-bar {
      margin-bottom: 8px;
    }

    .table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
    }

    table {
      width: 100%;
    }

    .selected-row {
      background: rgba(25, 118, 210, 0.08);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }
  `],
})
export class ClientsComponent implements OnInit {
  private readonly passesService = inject(PassesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private readonly search$ = new Subject<string>();

  readonly clients = signal<Pass[]>([]);
  readonly totalItems = signal(0);
  readonly loading = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  searchQuery = '';
  currentOffset = 0;

  readonly displayedColumns = [
    'select', 'user_id', 'fio', 'phone', 'email', 'bonus', 'discount', 'barcode',
  ];

  readonly selection = new SelectionModel<Pass>(true, []);

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.currentOffset = 0;
        this.loadClients(query);
      });

    this.loadClients();
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.currentOffset = event.pageIndex * event.pageSize;
    this.selection.clear();
    this.loadClients(this.searchQuery);
  }

  toggleAllRows(checked: boolean): void {
    if (checked) {
      this.selection.select(...this.clients());
    } else {
      this.selection.clear();
    }
  }

  isAllSelected(): boolean {
    const data = this.clients();
    return data.length > 0 && this.selection.selected.length === data.length;
  }

  openPushDialog(): void {
    const userIds = this.selection.selected.map((c) => c.user_id);

    const dialogRef = this.dialog.open(PushDialogComponent, {
      width: '520px',
      data: { userIds } satisfies PushDialogData,
      autoFocus: 'first-tabbable',
    });

    dialogRef.afterClosed().subscribe((result?: 'sent') => {
      if (result === 'sent') {
        this.snackBar.open('PUSH-сообщение успешно отправлено', 'OK', { duration: 4000 });
        this.selection.clear();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private loadClients(search?: string): void {
    this.loading.set(true);

    this.passesService
      .getPasses({
        search: search || undefined,
        limit: this.pageSize(),
        offset: this.currentOffset,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.clients.set(res.data ?? []);
          this.totalItems.set(res.meta?.size ?? 0);
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error as ApiErrorBody | null;
          this.snackBar.open(
            body?.message ?? `Ошибка загрузки клиентов (${err.status})`,
            'Закрыть',
            { duration: 5000 },
          );
        },
      });
  }
}
