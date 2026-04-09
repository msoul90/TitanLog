import { describe, expectTypeOf, it } from 'vitest';
import type { Exercise, BodyWeightEntry, HIITSession, AppState, AuthMode } from '../types.js';

describe('types.ts', () => {
  it('Exercise mantiene forma esperada', () => {
    expectTypeOf<Exercise>().toMatchTypeOf<{
      name: string;
      reps: string;
      ts: number;
    }>();
  });

  it('BodyWeightEntry permite metricas opcionales', () => {
    expectTypeOf<BodyWeightEntry>().toMatchTypeOf<{
      v: number;
      fat?: number;
      mmc?: number;
      u?: string;
    }>();
  });

  it('HIITSession requiere fecha, nombre y ejercicios', () => {
    expectTypeOf<HIITSession>().toMatchTypeOf<{
      date: string;
      name: string;
      exercises: Array<unknown>;
    }>();
  });

  it('AppState define timer y cache de PR', () => {
    expectTypeOf<AppState>().toHaveProperty('timerSeconds');
    expectTypeOf<AppState>().toHaveProperty('personalRecordCache');
  });

  it('AuthMode conserva valores permitidos', () => {
    expectTypeOf<AuthMode>().toEqualTypeOf<'signin' | 'signup' | 'reset'>();
  });
});
