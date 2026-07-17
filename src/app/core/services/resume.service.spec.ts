import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RESUME } from '../data/resume.data';
import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  let service: ResumeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResumeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Answer any still-pending constructor request, then assert none leaked.
    httpMock.match(() => true).forEach((req) => req.flush(null));
    httpMock.verify();
  });

  it('exposes the bundled snapshot immediately', () => {
    expect(service.data().profile.name).toBe('Iryna Ocheretko');
    expect(service.source()).toBe('bundled');
  });

  it('every experience role has a non-empty stack', () => {
    expect(service.data().experience.every((role) => role.stack.length > 0)).toBe(true);
  });

  it('exposes skill groups and certifications', () => {
    expect(service.data().skillGroups.length).toBeGreaterThan(0);
    expect(service.data().certifications.length).toBeGreaterThan(0);
  });

  it('swaps to the live payload when the API returns a valid response', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/resume'));
    const live = { ...RESUME, profile: { ...RESUME.profile, name: 'Live Iryna' } };
    req.flush({ data: live, meta: { version: 'v1', generatedAt: '2026-01-01T00:00:00Z' } });

    expect(service.source()).toBe('live');
    expect(service.data().profile.name).toBe('Live Iryna');
  });

  it('normalizes minimal API links, filling icon and handle', () => {
    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/resume'));
    // A link with only label + href (what a bare API might return).
    const minimal = {
      ...RESUME,
      profile: {
        ...RESUME.profile,
        links: [{ label: 'GitHub', href: 'https://github.com/x' }],
      },
    } as unknown;
    req.flush({ data: minimal, meta: { version: 'v1', generatedAt: 'x' } });

    const link = service.data().profile.links[0];
    expect(link.icon).toContain('pi-github');
    expect(link.handle).toBe('GitHub');
  });

  it('keeps the bundled snapshot when the API errors', () => {
    httpMock
      .expectOne((r) => r.url.endsWith('/api/v1/resume'))
      .flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(service.source()).toBe('bundled');
    expect(service.data().profile.name).toBe('Iryna Ocheretko');
  });
});
