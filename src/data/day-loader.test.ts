import { EXPECTED_DAYS_COUNT, getDayByNumber, loadDays } from './day-loader';

describe('day-loader', () => {
  it('loads days in order', () => {
    const days = loadDays();

    expect(days.length).toBe(EXPECTED_DAYS_COUNT);
    expect(days[0].dayNumber).toBe(1);
    expect(days[days.length - 1].dayNumber).toBe(days.length);
  });

  it('supports optional expected count validation', () => {
    const days = loadDays();
    expect(() => loadDays(days.length)).not.toThrow();
    expect(() => loadDays(days.length + 1)).toThrow(`Expected ${days.length + 1} days, received ${days.length}.`);
  });

  it('returns a day by number when valid', () => {
    const day = getDayByNumber(1);

    expect(day).toBeDefined();
    expect(day?.dayNumber).toBe(1);
    expect(day?.sections.length).toBeGreaterThan(0);
  });

  it('returns undefined for invalid day numbers', () => {
    expect(getDayByNumber(0)).toBeUndefined();
    expect(getDayByNumber(-3)).toBeUndefined();
    expect(getDayByNumber(999)).toBeUndefined();
  });
});
