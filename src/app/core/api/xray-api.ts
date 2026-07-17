import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import type { TraceDto } from './api-types';

@Injectable({ providedIn: 'root' })
export class XRayApi {
  private readonly api = inject(ApiClient);

  trace(): Observable<TraceDto> {
    return this.api.get<TraceDto>('/api/v1/xray/trace');
  }
}
