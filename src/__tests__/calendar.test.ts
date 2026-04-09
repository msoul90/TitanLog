import { beforeEach, describe, expect, it, vi } from 'vitest';

const { gDMock, isPRMock, loadGymMonthMock } = vi.hoisted(() => ({
  gDMock: vi.fn(),
  isPRMock: vi.fn(),
  loadGymMonthMock: vi.fn(),
}));

vi.mock('../app.js', () => ({
  gD: gDMock,
  MONTHS: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  DAYS_OF_WEEK: ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'],
  appState: {
    calendarDate: new Date(2026, 3, 1),
  },
  isPR: isPRMock,
  escHtml: (v: string) => v,
}));

vi.mock('../db.js', () => ({
  dk: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  loadGymMonth: loadGymMonthMock,
}));

import { changeMonth, renderCal, showCalDet } from '../calendar.js';

describe('calendar.ts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="calMo"></div>
      <div id="calGrid"></div>
      <div id="calDet" style="display:none"></div>
    `;
    gDMock.mockReturnValue({
      '2026-04-03': [{ name: 'Sentadilla', reps: '10', ts: 1, weight: '80', unit: 'kg', sets: '3' }],
    });
    isPRMock.mockReturnValue(false);
    loadGymMonthMock.mockResolvedValue(undefined);
  });

  it('renderCal pinta cabecera y celdas del calendario', () => {
    renderCal();
    expect(document.getElementById('calMo')?.textContent).toContain('Abril');
    expect(document.querySelectorAll('#calGrid .cl').length).toBe(7);
    expect(document.querySelectorAll('#calGrid .cd').length).toBeGreaterThan(28);
  });

  it('showCalDet muestra detalle cuando hay ejercicios', () => {
    showCalDet('2026-04-03', [{ name: 'Press de pecho', reps: '8', ts: 2, weight: '60', unit: 'kg', sets: '4' }]);
    const det = document.getElementById('calDet');
    expect(det?.style.display).toBe('block');
    expect(det?.innerHTML).toContain('Press de pecho');
  });

  it('changeMonth recarga datos y vuelve a renderizar', async () => {
    await changeMonth(1);
    expect(loadGymMonthMock).toHaveBeenCalled();
    expect(document.querySelectorAll('#calGrid .cl').length).toBe(7);
  });
});
