import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import type { SqlInjectionResultDto, XssResultDto } from './api-types';

@Injectable({ providedIn: 'root' })
export class SecurityLabApi {
  private readonly api = inject(ApiClient);

  sqlInjection(input: string): Observable<SqlInjectionResultDto> {
    return this.api.post<SqlInjectionResultDto>('/api/v1/security-lab/sql-injection', { input });
  }

  xss(input: string): Observable<XssResultDto> {
    return this.api.post<XssResultDto>('/api/v1/security-lab/xss', { input });
  }
}
