import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { PassesResponse } from '../models';

export interface PassesQueryParams {
  search?: string;
  limit: number;
  offset: number;
}

@Injectable({ providedIn: 'root' })
export class PassesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  getPasses(query: PassesQueryParams): Observable<PassesResponse> {
    const url = this.auth.getApiUrl('passes');

    let params = new HttpParams()
      .set('limit', query.limit)
      .set('offset', query.offset);

    if (query.search?.trim()) {
      params = params.set('search', `phone=${query.search.trim()}`);
    }

    return this.http.get<PassesResponse>(url, { params });
  }
}
