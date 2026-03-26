import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { PushRequest, PushResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  sendPush(request: PushRequest): Observable<PushResponse> {
    const url = this.auth.getApiUrl('message/push');
    return this.http.post<PushResponse>(url, request);
  }
}
