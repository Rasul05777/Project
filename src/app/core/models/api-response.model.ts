import { Pass } from './pass.model';

export interface ApiMeta {
  size: number;
  limit: number;
  offset: number;
}

export interface PassesResponse {
  data: Pass[];
  meta: ApiMeta;
}

export interface AuthResponse {
  token: string;
}

export interface PushRequest {
  message: string;
  user_ids: number[];
  date_start?: string;
}

export interface PushResponse {
  success: boolean;
  message?: string;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
}
