import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import type { ResumeDto } from './api-types';

@Injectable({ providedIn: 'root' })
export class ResumeApi {
  private readonly api = inject(ApiClient);

  get(): Observable<ResumeDto> {
    return this.api.get<ResumeDto>('/api/v1/resumes');
  }
}
