import { TestBed } from '@angular/core/testing';
import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  let service: ResumeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResumeService);
  });

  it('exposes the profile', () => {
    expect(service.data().profile.name).toBe('Iryna Ocheretko');
    expect(service.data().profile.links.length).toBeGreaterThan(0);
  });

  it('exposes experience roles, each with a non-empty stack', () => {
    const experience = service.data().experience;
    expect(experience.length).toBeGreaterThan(0);
    expect(experience.every((role) => role.stack.length > 0)).toBe(true);
  });

  it('exposes skill groups and certifications', () => {
    expect(service.data().skillGroups.length).toBeGreaterThan(0);
    expect(service.data().certifications.length).toBeGreaterThan(0);
  });
});
