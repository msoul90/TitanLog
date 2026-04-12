import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db.js', () => ({}));
vi.mock('../app.js', () => ({}));
vi.mock('../gym.js', () => ({}));
vi.mock('../calendar.js', () => ({}));
vi.mock('../progress.js', () => ({}));
vi.mock('../guides.js', () => ({}));
vi.mock('../hiit.js', () => ({}));

describe('main.ts', () => {
  beforeEach(() => {
    vi.resetModules();

    document.body.innerHTML = `
      <div id="toast"></div>
      <div id="exModTtl"></div>
      <div id="acDrop" style="display:block"></div>
      <input id="fName" value="x" />
      <input id="fW" value="10" />
      <input id="fS" value="3" />
      <input id="fR" value="10" />
      <input id="fN" value="" />
      <select id="fU"><option value="lb" selected>lb</option></select>
      <dialog id="exMod" class="overlay"></dialog>
      <button class="nav-btn" onclick="showS('today', this)"></button>
    `;

    (globalThis as any).openM = vi.fn();
    (globalThis as any).closeM = vi.fn();
    (globalThis as any).renderToday = vi.fn();
    (globalThis as any).initLogin = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).showS = vi.fn();
    (globalThis as any).initHiit = vi.fn();
    (globalThis as any).gD = vi.fn(() => ({}));
    (globalThis as any).saveGymDay = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).viewDate = new Date(2026, 3, 9);
    (globalThis as any).appState = { viewDate: new Date(2026, 3, 9), editExerciseId: null };
    (globalThis as any).location.hash = '#today';
    (globalThis as any).confirm = vi.fn(() => true);
  });

  it('expone funciones globales al importar main', async () => {
    await import('../main.js');
    expect(typeof (globalThis as any).openAdd).toBe('function');
    expect(typeof (globalThis as any).saveEx).toBe('function');
  });

  it('openAdd limpia campos y abre modal', async () => {
    await import('../main.js');
    (globalThis as any).openAdd();
    expect((document.getElementById('fName') as HTMLInputElement).value).toBe('');
    expect((globalThis as any).openM).toHaveBeenCalledWith('exMod');
  });

  it('saveEx guarda un ejercicio nuevo y refresca UI', async () => {
    await import('../main.js');
    (globalThis as any).gD = vi.fn(() => ({}));

    await (globalThis as any).saveEx();

    expect((globalThis as any).saveGymDay).toHaveBeenCalledTimes(1);
    expect((globalThis as any).closeM).toHaveBeenCalledWith('exMod');
    expect((globalThis as any).renderToday).toHaveBeenCalled();
  });

  it('editEx abre modal con datos existentes', async () => {
    await import('../main.js');
    (globalThis as any).gD = vi.fn(() => ({
      '2026-04-09': [{ name: 'Press', reps: '8', weight: '60', sets: '3', unit: 'kg', notes: 'ok', ts: 111 }]
    }));

    (globalThis as any).editEx('2026-04-09', 111);

    expect((document.getElementById('exModTtl') as HTMLElement).textContent).toContain('Editar');
    expect((document.getElementById('fName') as HTMLInputElement).value).toBe('Press');
    expect((globalThis as any).openM).toHaveBeenCalledWith('exMod');
  });

  it('delEx elimina ejercicio confirmado', async () => {
    await import('../main.js');
    (globalThis as any).gD = vi.fn(() => ({
      '2026-04-09': [{ name: 'Press', reps: '8', ts: 111 }, { name: 'Sentadilla', reps: '10', ts: 222 }]
    }));

    await (globalThis as any).delEx('2026-04-09', 111);

    expect((globalThis as any).saveGymDay).toHaveBeenCalledWith('2026-04-09', [{ name: 'Sentadilla', reps: '10', ts: 222 }]);
    expect((globalThis as any).renderToday).toHaveBeenCalled();
  });

  it('registra handlers fallback de temporizador HIIT', async () => {
    await import('../main.js');

    (globalThis as any).adjustHiitTimer();
    expect(document.getElementById('toast')?.textContent).toContain('Temporizador HIIT no disponible');
  });

  it('saveEx muestra error si faltan nombre o reps', async () => {
    await import('../main.js');

    (document.getElementById('fName') as HTMLInputElement).value = '';
    await (globalThis as any).saveEx();
    expect(document.getElementById('toast')?.textContent).toContain('nombre');

    (document.getElementById('fName') as HTMLInputElement).value = 'Press';
    (document.getElementById('fR') as HTMLInputElement).value = '';
    await (globalThis as any).saveEx();
    expect(document.getElementById('toast')?.textContent).toContain('repeticiones');
  });

  it('saveEx usa fallback sD cuando saveGymDay no existe', async () => {
    await import('../main.js');
    const sDMock = vi.fn();
    (globalThis as any).saveGymDay = undefined;
    (globalThis as any).sD = sDMock;
    (globalThis as any).gD = vi.fn(() => ({ '2026-04-09': [] }));

    await (globalThis as any).saveEx();

    expect(sDMock).toHaveBeenCalledTimes(1);
  });

  it('delEx no elimina cuando confirm devuelve false', async () => {
    await import('../main.js');
    (globalThis as any).confirm = vi.fn(() => false);

    await (globalThis as any).delEx('2026-04-09', 111);

    expect((globalThis as any).saveGymDay).not.toHaveBeenCalled();
  });

  it('ejecuta callback de DOMContentLoaded y cierra modal al click en backdrop', async () => {
    const originalAddEventListener = document.addEventListener.bind(document);
    let domReadyHandler: EventListener | null = null;

    vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'DOMContentLoaded') {
        domReadyHandler = listener as EventListener;
        return;
      }
      originalAddEventListener(type, listener as EventListener);
    });

    await import('../main.js');
    expect(domReadyHandler).toBeTruthy();

    if (domReadyHandler) {
      await (domReadyHandler as (event: Event) => Promise<void> | void)(new Event('DOMContentLoaded'));
    }

    expect((globalThis as any).initLogin).toHaveBeenCalled();
    expect((globalThis as any).showS).toHaveBeenCalledWith('today', expect.any(HTMLElement));

    const overlay = document.getElementById('exMod') as HTMLDialogElement;
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect((globalThis as any).closeM).toHaveBeenCalledWith('exMod');
  });

  it('DOMContentLoaded no llama showS cuando no hay nav button o showS no es funcion', async () => {
    const originalAddEventListener = document.addEventListener.bind(document);
    let domReadyHandler: EventListener | null = null;

    vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'DOMContentLoaded') {
        domReadyHandler = listener as EventListener;
        return;
      }
      originalAddEventListener(type, listener as EventListener);
    });

    document.body.innerHTML = `
      <div id="toast"></div>
      <dialog id="exMod" class="overlay"></dialog>
    `;
    (globalThis as any).showS = 'not-a-function';
    (globalThis as any).location.hash = '#pantalla-inexistente';

    await import('../main.js');
    expect(domReadyHandler).toBeTruthy();

    if (domReadyHandler) {
      await (domReadyHandler as (event: Event) => Promise<void> | void)(new Event('DOMContentLoaded'));
    }

    expect((globalThis as any).initLogin).toHaveBeenCalled();
  });

  it('click dentro del contenido del overlay no cierra modal', async () => {
    const originalAddEventListener = document.addEventListener.bind(document);
    let domReadyHandler: EventListener | null = null;

    vi.spyOn(document, 'addEventListener').mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'DOMContentLoaded') {
        domReadyHandler = listener as EventListener;
        return;
      }
      originalAddEventListener(type, listener as EventListener);
    });

    document.body.innerHTML = `
      <div id="toast"></div>
      <button class="nav-btn" onclick="showS('today', this)"></button>
      <dialog id="exMod" class="overlay"><div id="inside"></div></dialog>
    `;

    await import('../main.js');
    if (domReadyHandler) {
      await (domReadyHandler as (event: Event) => Promise<void> | void)(new Event('DOMContentLoaded'));
    }

    const overlay = document.getElementById('exMod') as HTMLDialogElement;
    const inside = document.getElementById('inside') as HTMLElement;
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const callsAfterBackdrop = (globalThis as any).closeM.mock.calls.length;

    inside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect((globalThis as any).closeM.mock.calls.length).toBe(callsAfterBackdrop);
  });

  it('editEx muestra toast cuando no existe el ejercicio', async () => {
    await import('../main.js');
    (globalThis as any).gD = vi.fn(() => ({ '2026-04-09': [] }));

    (globalThis as any).editEx('2026-04-09', 999);

    expect(document.getElementById('toast')?.textContent).toContain('No se encontró');
  });

  it('delEx usa fallback sD cuando saveGymDay no existe', async () => {
    await import('../main.js');
    const sDMock = vi.fn();
    (globalThis as any).saveGymDay = undefined;
    (globalThis as any).sD = sDMock;
    (globalThis as any).gD = vi.fn(() => ({
      '2026-04-09': [{ name: 'A', reps: '8', ts: 1 }, { name: 'B', reps: '10', ts: 2 }]
    }));

    await (globalThis as any).delEx('2026-04-09', 1);

    expect(sDMock).toHaveBeenCalledTimes(1);
  });

  it('saveEx actualiza ejercicio existente en modo edicion', async () => {
    await import('../main.js');
    (globalThis as any).appState.editExerciseId = '2026-04-09::111';
    (globalThis as any).gD = vi.fn(() => ({
      '2026-04-09': [{ name: 'Press', reps: '8', ts: 111 }]
    }));

    await (globalThis as any).saveEx();

    const payload = (globalThis as any).saveGymDay.mock.calls[0]?.[1] || [];
    expect(payload[0]?.ts).toBe(111);
    expect(document.getElementById('toast')?.textContent).toContain('actualizado');
  });

  it('saveEx agrega si editId es invalido o no coincide', async () => {
    await import('../main.js');
    (globalThis as any).appState.editExerciseId = '2026-04-10::xx';
    (globalThis as any).gD = vi.fn(() => ({ '2026-04-09': [{ name: 'A', reps: '8', ts: 1 }] }));

    await (globalThis as any).saveEx();

    const payload = (globalThis as any).saveGymDay.mock.calls[0]?.[1] || [];
    expect(payload.length).toBe(2);
  });

  it('fallbacks de timer respetan handlers existentes', async () => {
    (globalThis as any).adjustHiitTimer = vi.fn();
    (globalThis as any).toggleHiitTimer = vi.fn();
    (globalThis as any).resetHiitTimer = vi.fn();

    await import('../main.js');

    (globalThis as any).adjustHiitTimer();
    (globalThis as any).toggleHiitTimer();
    (globalThis as any).resetHiitTimer();

    expect((globalThis as any).adjustHiitTimer).toHaveBeenCalled();
    expect((globalThis as any).toggleHiitTimer).toHaveBeenCalled();
    expect((globalThis as any).resetHiitTimer).toHaveBeenCalled();
  });

  it('toast global no falla si no existe elemento #toast', async () => {
    await import('../main.js');
    document.getElementById('toast')?.remove();

    expect(() => (globalThis as any).toast('x')).not.toThrow();
  });

  it('saveEx funciona cuando no existe appState global', async () => {
    await import('../main.js');
    delete (globalThis as any).appState;
    (globalThis as any).viewDate = new Date(2026, 3, 9);

    await (globalThis as any).saveEx();

    expect((globalThis as any).saveGymDay).toHaveBeenCalled();
  });

  it('saveEx usa new Date cuando viewDate no es valido', async () => {
    await import('../main.js');
    (globalThis as any).appState = { viewDate: 'bad-date', editExerciseId: null };
    (globalThis as any).viewDate = 'bad-date';

    await (globalThis as any).saveEx();

    expect((globalThis as any).saveGymDay).toHaveBeenCalled();
  });

  it('saveEx agrega ejercicio cuando editId parsea pero ts no existe', async () => {
    await import('../main.js');
    (globalThis as any).appState.editExerciseId = '2026-04-09::999';
    (globalThis as any).gD = vi.fn(() => ({ '2026-04-09': [{ name: 'A', reps: '8', ts: 111 }] }));

    await (globalThis as any).saveEx();

    const payload = (globalThis as any).saveGymDay.mock.calls[0]?.[1] || [];
    expect(payload.length).toBe(2);
  });

  it('saveEx normaliza appState cuando falta editExerciseId', async () => {
    await import('../main.js');
    (globalThis as any).appState = { viewDate: new Date(2026, 3, 9) };

    await (globalThis as any).saveEx();

    expect((globalThis as any).appState.editExerciseId).toBeNull();
    expect((globalThis as any).saveGymDay).toHaveBeenCalled();
  });

  it('saveEx usa fallback legacy viewDate cuando appState no conserva Date', async () => {
    await import('../main.js');

    const state: Record<string, unknown> = { editExerciseId: null };
    Object.defineProperty(state, 'viewDate', {
      get: () => 'invalid-view-date',
      set: () => {
        // Intentionally ignore assignments to force getCurrentViewDate legacy branch.
      },
      configurable: true,
    });

    (globalThis as any).appState = state;
    (globalThis as any).viewDate = new Date(2026, 3, 9);

    await (globalThis as any).saveEx();

    expect((globalThis as any).saveGymDay).toHaveBeenCalledWith('2026-04-09', expect.any(Array));
  });
});
