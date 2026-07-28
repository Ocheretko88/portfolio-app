import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ExerciseDto } from '../../../core/api/api-types';
import { GymLogForm } from './log-form';

describe('GymLogForm', () => {
  let httpMock: HttpTestingController;

  const exercises: ExerciseDto[] = [
    {
      id: 1,
      name: 'Присід',
      slug: 'squat',
      category: 'compound',
      isBodyweight: false,
      defaultUnit: 'kg',
    },
    {
      id: 2,
      name: 'Жим лежачи',
      slug: 'bench-press',
      category: 'compound',
      isBodyweight: false,
      defaultUnit: 'kg',
    },
  ];

  function flushCatalog() {
    httpMock
      .expectOne((req) => req.url.endsWith('/api/v1/gym/exercises'))
      .flush({ data: exercises, meta: { version: 'v1', generatedAt: '2026-07-27T00:00:00Z' } });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GymLogForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the component with one empty set row and loads the catalog', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    expect(component['sets'].length).toBe(1);
    flushCatalog();
  });

  it('does not submit an invalid form (missing exercise/weight)', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();

    fixture.componentInstance['submit']();

    httpMock.expectNone((req) => req.method === 'POST');
    expect(fixture.componentInstance['form'].touched).toBe(true);
  });

  it('addSet() appends a row and removeSet() removes it (min 1 kept)', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['addSet']();
    expect(component['sets'].length).toBe(2);

    component['removeSet'](1);
    expect(component['sets'].length).toBe(1);

    // Never removes the last remaining row.
    component['removeSet'](0);
    expect(component['sets'].length).toBe(1);
  });

  it('repeatLastSet() duplicates the last row selections', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['setGroup'](0).patchValue({ exerciseId: 1, search: 'Присід', weight: 60, reps: 5 });
    component['repeatLastSet']();

    expect(component['sets'].length).toBe(2);
    const second = component['setGroup'](1).getRawValue();
    expect(second['exerciseId']).toBe(1);
    expect(second['weight']).toBe(60);
    expect(second['reps']).toBe(5);
  });

  it('stepWeight()/stepReps() adjust by the unit step and never go below 0', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['stepWeight'](0, 2.5);
    expect(component['setGroup'](0).controls['weight'].value).toBe(2.5);

    component['stepWeight'](0, -10);
    expect(component['setGroup'](0).controls['weight'].value).toBe(0);

    component['stepReps'](0, 1);
    expect(component['setGroup'](0).controls['reps'].value).toBe(1);
  });

  it('weightStep() reflects the current unit even after switching (not memoized stale)', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    expect(component['weightStep']()).toBe(2.5);

    component['form'].patchValue({ unit: 'lb' });
    expect(component['weightStep']()).toBe(5);

    component['form'].patchValue({ unit: 'kg' });
    expect(component['weightStep']()).toBe(2.5);
  });

  it('submits a valid session with weight converted to integer grams', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['form'].patchValue({ performedAt: '2026-07-28T10:00' });
    component['setGroup'](0).patchValue({ exerciseId: 1, weight: 62.5, reps: 5 });

    component['submit']();

    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.endsWith('/api/v1/gym/sessions'),
    );
    expect(req.request.body.sets[0].weightGrams).toBe(62500);
    expect(req.request.body.sets[0].exerciseId).toBe(1);
    expect(req.request.body.sets[0].setNumber).toBe(1);

    req.flush({
      data: {
        id: 1,
        performedAt: '2026-07-28T10:00:00Z',
        title: null,
        cycleDay: null,
        durationMin: null,
        notes: null,
        sets: [],
      },
      meta: { version: 'v1', generatedAt: '2026-07-28T10:00:00Z' },
    });

    expect(component['submittedCount']()).toBe(1);
    expect(component['sets'].length).toBe(1);
  });

  it('converts lb entries to grams using the pound conversion', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['form'].patchValue({ unit: 'lb' });
    component['setGroup'](0).patchValue({ exerciseId: 2, weight: 100, reps: 3 });
    component['submit']();

    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.endsWith('/api/v1/gym/sessions'),
    );
    expect(req.request.body.sets[0].weightGrams).toBe(45359);
    req.flush({
      data: {
        id: 2,
        performedAt: '2026-07-28T10:00:00Z',
        title: null,
        cycleDay: null,
        durationMin: null,
        notes: null,
        sets: [],
      },
      meta: { version: 'v1', generatedAt: '2026-07-28T10:00:00Z' },
    });
  });

  it('surfaces a server error without crashing', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    const component = fixture.componentInstance;

    component['setGroup'](0).patchValue({ exerciseId: 1, weight: 20, reps: 5 });
    component['submit']();

    const req = httpMock.expectOne(
      (r) => r.method === 'POST' && r.url.endsWith('/api/v1/gym/sessions'),
    );
    req.flush(
      { error: { code: 'ValidationException', message: 'bad' } },
      { status: 422, statusText: 'Unprocessable' },
    );

    expect(component['submitError']()).toContain('Could not save');
  });

  it('renders the exercise catalog as selectable options (nothing typed to submit)', () => {
    const fixture = TestBed.createComponent(GymLogForm);
    fixture.detectChanges();
    flushCatalog();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const options = Array.from(el.querySelectorAll('#exercise-select-0 option')).map((o) =>
      o.textContent?.trim(),
    );
    expect(options).toContain('Присід');
    expect(options).toContain('Жим лежачи');
  });
});
